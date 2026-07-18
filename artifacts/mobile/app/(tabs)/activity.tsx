import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Transaction, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "All" | "Sent" | "Received" | "Rewards";

const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  send: { name: "arrow-up-circle", color: "#EF4444" },
  receive: { name: "arrow-down-circle", color: "#22C55E" },
  payment: { name: "card", color: "#3B82F6" },
  reward: { name: "star", color: "#F59E0B" },
  topup: { name: "add-circle", color: "#22C55E" },
};

function TransactionItem({ item }: { item: Transaction }) {
  const colors = useColors();
  const icon = ICON_MAP[item.type] ?? { name: "ellipse" as keyof typeof Ionicons.glyphMap, color: colors.mutedForeground };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 2) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const amountStr =
    item.type === "reward"
      ? "Points"
      : `${item.amount >= 0 ? "+" : "-"}$${Math.abs(item.amount).toFixed(2)}`;

  const amountColor =
    item.type === "reward" ? "#F59E0B" : item.amount >= 0 ? "#22C55E" : colors.foreground;

  return (
    <View style={[styles.txItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.txIcon, { backgroundColor: `${icon.color}22` }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>
      <View style={styles.txBody}>
        <View style={styles.txRow}>
          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[styles.txAmount, { color: amountColor }]}>{amountStr}</Text>
        </View>
        <View style={styles.txMeta}>
          {item.merchant ? (
            <Text style={[styles.txMetaText, { color: colors.mutedForeground }]}>
              {item.merchant}
            </Text>
          ) : null}
          <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
            {formatDate(item.date)}
          </Text>
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

function groupByDate(transactions: Transaction[]) {
  const groups: { title: string; data: Transaction[] }[] = [];
  const map = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    let label: string;
    if (diff < 1) label = "Today";
    else if (diff < 2) label = "Yesterday";
    else label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  });

  map.forEach((data, title) => groups.push({ title, data }));
  return groups;
}

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<FilterType>("All");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = transactions.filter((tx) => {
    if (filter === "All") return true;
    if (filter === "Sent") return tx.type === "send" || tx.type === "payment";
    if (filter === "Received") return tx.type === "receive" || tx.type === "topup";
    if (filter === "Rewards") return tx.type === "reward";
    return true;
  });

  const groups = groupByDate(filtered);

  const flatData: Array<{ type: "header"; title: string } | { type: "item"; tx: Transaction }> = [];
  groups.forEach((g) => {
    flatData.push({ type: "header", title: g.title });
    g.data.forEach((tx) => flatData.push({ type: "item", tx }));
  });

  const handleRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filters: FilterType[] = ["All", "Sent", "Received", "Rewards"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Activity</Text>
        <Pressable style={[styles.filterIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="options-outline" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {filters.map((f) => (
          <Pressable
            key={f}
            onPress={() => { setFilter(f); Haptics.selectionAsync(); }}
            style={styles.filterTab}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === f ? colors.primary : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
            {filter === f && (
              <View style={[styles.filterUnderline, { backgroundColor: colors.primary }]} />
            )}
          </Pressable>
        ))}
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No transactions yet
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <Text style={[styles.dateHeader, { color: colors.mutedForeground }]}>
                {item.title}
              </Text>
            );
          }
          return (
            <View style={[styles.txContainer, { backgroundColor: colors.card }]}>
              <TransactionItem item={item.tx} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "800" as const, fontFamily: "Inter_700Bold" },
  filterIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  filterTab: { flex: 1, alignItems: "center", paddingBottom: 12, position: "relative" },
  filterTabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  filterUnderline: { position: "absolute", bottom: 0, left: "10%", right: "10%", height: 2, borderRadius: 1 },
  txContainer: { marginHorizontal: 20, marginBottom: 1, borderRadius: 0 },
  txItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  txIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginRight: 14 },
  txBody: { flex: 1 },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  txDesc: { fontSize: 15, fontFamily: "Inter_500Medium", flex: 1, marginRight: 10 },
  txAmount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  txMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  txMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pendingText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dateHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
});
