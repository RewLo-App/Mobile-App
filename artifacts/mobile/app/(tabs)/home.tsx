import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Transaction, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

function TransactionRow({ item }: { item: Transaction }) {
  const colors = useColors();

  const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    send: { name: "arrow-up-circle", color: "#EF4444" },
    receive: { name: "arrow-down-circle", color: "#22C55E" },
    payment: { name: "card", color: "#3B82F6" },
    reward: { name: "star", color: "#F59E0B" },
    topup: { name: "add-circle", color: "#22C55E" },
  };

  const icon = iconMap[item.type] ?? { name: "ellipse" as keyof typeof Ionicons.glyphMap, color: colors.mutedForeground };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const amountStr =
    item.type === "reward"
      ? "Points"
      : `${item.amount >= 0 ? "+" : ""}${item.amount.toFixed(2)} USDC`;

  const amountColor =
    item.type === "reward"
      ? "#F59E0B"
      : item.amount >= 0
      ? "#22C55E"
      : colors.foreground;

  return (
    <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.txIconWrap, { backgroundColor: `${icon.color}22` }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
          {item.merchant ? `${item.merchant} · ` : ""}{formatDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>{amountStr}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, balance, trustPayPoints, transactions } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const { sendMoney } = useWallet();

  const recent = transactions.slice(0, 4);

  const handleSend = () => {
    if (!sendAmount || !sendRecipient) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sendMoney(parseFloat(sendAmount), sendRecipient);
    setSendModal(false);
    setSendAmount("");
    setSendRecipient("");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#041828", "#062040", "#041120"]}
          style={[styles.headerGradient, { paddingTop: topPad + 16 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Good morning
              </Text>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user?.name?.split(" ")[0] ?? "Fan"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={[styles.clubBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="soccer" size={16} color="#fff" />
                <Text style={styles.clubBadgeText}>{user?.club?.split(" ").pop()}</Text>
              </Pressable>
              <Pressable style={[styles.notifBtn, { backgroundColor: colors.card }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Balance Card */}
          <LinearGradient
            colors={["#1D4ED8", "#2563EB", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Pressable onPress={() => setBalanceVisible(!balanceVisible)}>
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `$${balance.toFixed(2)}` : "••••••"}
            </Text>
            <Text style={styles.balanceCurrency}>USDC · Stablecoin</Text>

            <View style={styles.pointsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.pointsText}>
                {trustPayPoints.toLocaleString()} TrustPay Points
              </Text>
            </View>

            {/* Card chip decoration */}
            <View style={styles.chipDecor}>
              <View style={styles.chip} />
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            {[
              { label: "Send", icon: "arrow-up" as keyof typeof Ionicons.glyphMap, action: () => setSendModal(true) },
              { label: "Receive", icon: "arrow-down" as keyof typeof Ionicons.glyphMap, action: () => {} },
              { label: "Pay", icon: "scan" as keyof typeof Ionicons.glyphMap, action: () => {} },
              { label: "Top Up", icon: "add" as keyof typeof Ionicons.glyphMap, action: () => {} },
            ].map((a) => (
              <Pressable
                key={a.label}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.action(); }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}22` }]}>
                  <Ionicons name={a.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Activity
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/activity")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recent.map((tx) => (
              <TransactionRow key={tx.id} item={tx} />
            ))}
          </View>
        </View>

        {/* Club Loyalty Banner */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loyaltyBanner}
          >
            <View>
              <Text style={styles.loyaltyTitle}>Club Loyalty Status</Text>
              <Text style={styles.loyaltyClub}>{user?.club}</Text>
              <Text style={styles.loyaltyPoints}>
                Gold Member · {trustPayPoints.toLocaleString()} pts
              </Text>
            </View>
            <MaterialCommunityIcons name="trophy-outline" size={40} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Send Modal */}
      <Modal visible={sendModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setSendModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Send Money</Text>
          <TextInput
            style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
            placeholder="Recipient email or @tag"
            placeholderTextColor={colors.mutedForeground}
            value={sendRecipient}
            onChangeText={setSendRecipient}
          />
          <TextInput
            style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
            placeholder="Amount (USDC)"
            placeholderTextColor={colors.mutedForeground}
            value={sendAmount}
            onChangeText={setSendAmount}
            keyboardType="decimal-pad"
          />
          <Pressable
            onPress={handleSend}
            style={[styles.modalBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.modalBtnText}>Send</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  clubBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 5 },
  clubBadgeText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  notifBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  balanceCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    position: "relative",
    overflow: "hidden",
  },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium" },
  balanceAmount: { color: "#FFFFFF", fontSize: 42, fontWeight: "800" as const, fontFamily: "Inter_700Bold", letterSpacing: -1, marginBottom: 2 },
  balanceCurrency: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.2)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pointsText: { color: "#F59E0B", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  chipDecor: { position: "absolute", right: 22, top: 22 },
  chip: { width: 36, height: 28, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  txIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1, gap: 3 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  loyaltyBanner: { borderRadius: 18, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  loyaltyTitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  loyaltyClub: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  loyaltyPoints: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#1A3A5C", alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular" },
  modalBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
