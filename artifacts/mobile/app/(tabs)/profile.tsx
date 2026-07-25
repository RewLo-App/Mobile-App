import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getClubById } from "@/constants/clubs";
import { Transaction, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "All" | "Sent" | "Received" | "Rewards";

const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  send:    { name: "arrow-up-circle",   color: "#EF4444" },
  receive: { name: "arrow-down-circle", color: "#22C55E" },
  payment: { name: "card",              color: "#3B82F6" },
  reward:  { name: "star",              color: "#F59E0B" },
  topup:   { name: "add-circle",        color: "#22C55E" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(txs: Transaction[]) {
  const groups: { title: string; data: Transaction[] }[] = [];
  const map = new Map<string, Transaction[]>();
  txs.forEach((tx) => {
    const d = new Date(tx.date);
    const diff = (Date.now() - d.getTime()) / 86400000;
    const label =
      diff < 1 ? "Today" :
      diff < 2 ? "Yesterday" :
      d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  });
  map.forEach((data, title) => groups.push({ title, data }));
  return groups;
}

function TxRow({ item, isLast }: { item: Transaction; isLast: boolean }) {
  const colors = useColors();
  const icon = ICON_MAP[item.type] ?? { name: "ellipse" as keyof typeof Ionicons.glyphMap, color: colors.mutedForeground };
  const amountStr =
    item.type === "reward"
      ? "Points"
      : `${item.amount >= 0 ? "+" : "-"}$${Math.abs(item.amount).toFixed(2)}`;
  const amountColor =
    item.type === "reward" ? "#F59E0B" : item.amount >= 0 ? "#22C55E" : colors.foreground;

  return (
    <View style={[styles.txItem, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.txIcon, { backgroundColor: `${icon.color}22` }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.txBody}>
        <View style={styles.txTopRow}>
          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.txAmount, { color: amountColor }]}>{amountStr}</Text>
        </View>
        <View style={styles.txMeta}>
          {item.merchant ? (
            <Text style={[styles.txMetaText, { color: colors.mutedForeground }]}>{item.merchant}</Text>
          ) : null}
          <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
          {item.status === "pending" && (
            <View style={[styles.pendingBadge, { backgroundColor: "#F59E0B22" }]}>
              <Text style={[styles.pendingText, { color: "#F59E0B" }]}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (v: boolean) => void;
  noBorder?: boolean;
}

function SettingRow({ icon, label, value, onPress, showArrow = true, danger, toggle, toggled, onToggle, noBorder }: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => { if (onPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); } }}
      style={({ pressed }) => [
        styles.settingRow,
        !noBorder && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: pressed && !toggle ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? "#EF444422" : `${colors.primary}22` }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value ? <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        {toggle ? (
          <Switch value={toggled} onValueChange={onToggle} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount, rewloPoints, totalSpend, transactions, selectedClubId } = useWallet();
  const selectedClub = getClubById(selectedClubId);

  const [biometrics, setBiometrics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [txFilter, setTxFilter] = useState<FilterType>("All");
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const toggleActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = activityOpen ? 0 : 1;
    Animated.spring(chevronAnim, { toValue, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    setActivityOpen((prev) => !prev);
  };

  const handleLogout = () => {
    // React Native Alert is not consistently interactive on web. Sign out
    // immediately: local tokens/state are cleared by the context, while the
    // backend refresh-token revocation continues in the background.
    void logout();
    router.replace("/login");
  };

  const performAccountDeletion = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      await deleteAccount();
      router.replace("/login");
    } catch {
      Alert.alert("Unable to delete account", "Please check your connection and try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmVisible(true);
  };

  const filteredTx = transactions.filter((tx) => {
    if (txFilter === "All") return true;
    if (txFilter === "Sent") return tx.type === "send" || tx.type === "payment";
    if (txFilter === "Received") return tx.type === "receive" || tx.type === "topup";
    if (txFilter === "Rewards") return tx.type === "reward";
    return true;
  });

  const groups = groupByDate(filteredTx);
  const filters: FilterType[] = ["All", "Sent", "Received", "Rewards"];

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });

  return (
    <>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
    >
      {/* Header */}
      <LinearGradient
        colors={[selectedClub.gradientStart, selectedClub.gradientEnd]}
        style={[styles.headerGradient, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.avatarSection}>
          <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.split(" ").map((n) => n[0]).join("") ?? "AJ"}
            </Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View style={[styles.memberBadge, { backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.4)" }]}>
            <Ionicons name="football-outline" size={12} color="#fff" />
            <Text style={[styles.memberText, { color: "#fff" }]}>{selectedClub.shortName} Fan</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          {[
            { label: "Member Since", value: user?.memberSince || "—" },
            { label: "Rewlo Pts", value: rewloPoints.toLocaleString() },
            { label: "Total Spend", value: `$${totalSpend.toFixed(0)}` },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Account — includes collapsible Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Account</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="person-outline" label="Personal Info" value={user?.phone} />
          <SettingRow icon="football-outline" label="My Club" value={selectedClub.shortName} onPress={() => router.push("/club-selector")} />
          <SettingRow icon="qr-code-outline" label="My QR Code" />

          {/* Activity — collapsible trigger */}
          <Pressable
            onPress={toggleActivity}
            style={({ pressed }) => [
              styles.settingRow,
              activityOpen
                ? { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
                : { borderBottomWidth: 0 },
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Activity</Text>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                {transactions.length} transactions
              </Text>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </Animated.View>
            </View>
          </Pressable>

          {/* Expanded activity panel */}
          {activityOpen && (
            <View>
              {/* Filter tabs */}
              <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
                {filters.map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => { setTxFilter(f); Haptics.selectionAsync(); }}
                    style={styles.filterTab}
                  >
                    <Text style={[styles.filterTabText, { color: f === txFilter ? colors.primary : colors.mutedForeground }]}>
                      {f}
                    </Text>
                    {f === txFilter && (
                      <View style={[styles.filterUnderline, { backgroundColor: colors.primary }]} />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Transactions */}
              {filteredTx.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Ionicons name="receipt-outline" size={36} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions</Text>
                </View>
              ) : (
                groups.map((group) => (
                  <View key={group.title}>
                    <Text style={[styles.dateHeader, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
                      {group.title}
                    </Text>
                    {group.data.map((tx, idx) => (
                      <TxRow key={tx.id} item={tx} isLast={idx === group.data.length - 1 && group === groups[groups.length - 1]} />
                    ))}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Security</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="finger-print-outline" label="Biometrics" toggle toggled={biometrics} onToggle={setBiometrics} showArrow={false} noBorder />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Preferences</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="notifications-outline" label="Push Notifications" toggle toggled={notifications} onToggle={setNotifications} showArrow={false} />
          <SettingRow icon="globe-outline" label="Currency" value="USD" />
          <SettingRow icon="language-outline" label="Language" value="English" noBorder />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Support</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="chatbubble-outline" label="Contact Us" onPress={() => Linking.openURL("mailto:support@rewlo.io")} noBorder />
        </View>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginTop: 22 }]}>
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} showArrow={false} danger />
          <SettingRow icon="trash-outline" label={deletingAccount ? "Deleting Account…" : "Delete Account"} onPress={handleDeleteAccount} showArrow={false} danger noBorder />
        </View>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        RewLo v1.0.0 · Early Access Preview
      </Text>
    </ScrollView>
    <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
      <View style={styles.deleteOverlay}>
        <View style={[styles.deleteDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="warning-outline" size={30} color={colors.destructive} />
          <Text style={[styles.deleteTitle, { color: colors.foreground }]}>Delete account?</Text>
          <Text style={[styles.deleteMessage, { color: colors.mutedForeground }]}>This can’t be undone.</Text>
          <View style={styles.deleteActions}>
            <Pressable onPress={() => setDeleteConfirmVisible(false)} style={[styles.deleteButton, { borderColor: colors.border }]}>
              <Text style={[styles.deleteButtonText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => { setDeleteConfirmVisible(false); void performAccountDeletion(); }} style={[styles.deleteButton, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.deleteButtonText, { color: "#fff" }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 10 },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  memberText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  settingsCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth },
  filterTab: { flex: 1, alignItems: "center", paddingVertical: 10, position: "relative" },
  filterTabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  filterUnderline: { position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2, borderRadius: 1 },
  dateHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, borderTopWidth: StyleSheet.hairlineWidth },
  txItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txBody: { flex: 1 },
  txTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1, marginRight: 8 },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  txMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pendingText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyPanel: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  deleteOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  deleteDialog: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  deleteTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  deleteMessage: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  deleteActions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 14 },
  deleteButton: { flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  deleteButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 24, marginBottom: 8 },
});
