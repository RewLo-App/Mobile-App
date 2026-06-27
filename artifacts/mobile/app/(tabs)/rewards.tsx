import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Offer, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Sports: "football-outline",
  Stadium: "business-outline",
  Media: "tv-outline",
  Gaming: "game-controller-outline",
};

interface OfferCardProps {
  item: Offer;
  onRedeem: (id: string) => void;
  canAfford: boolean;
}

function OfferCard({ item, onRedeem, canAfford }: OfferCardProps) {
  const colors = useColors();
  const icon = CATEGORY_ICONS[item.category] ?? "pricetag-outline";

  return (
    <View style={[styles.offerCard, { backgroundColor: colors.card, borderColor: item.redeemed ? colors.success : colors.border }]}>
      <View style={styles.offerTop}>
        <View style={[styles.offerIconWrap, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.offerBadgeWrap}>
          <View style={[styles.discountBadge, { backgroundColor: item.redeemed ? `${colors.success}33` : `${colors.primary}22` }]}>
            <Text style={[styles.discountText, { color: item.redeemed ? colors.success : colors.primary }]}>
              {item.redeemed ? "REDEEMED" : item.discount}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.offerMerchant, { color: colors.foreground }]}>{item.merchant}</Text>
      <Text style={[styles.offerDesc, { color: colors.mutedForeground }]}>{item.description}</Text>

      <View style={styles.offerFooter}>
        <View style={styles.offerCost}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={[styles.offerCostText, { color: colors.mutedForeground }]}>
            {item.pointsCost.toLocaleString()} pts
          </Text>
        </View>
        <Text style={[styles.offerExpiry, { color: colors.mutedForeground }]}>
          Exp {item.expiresAt}
        </Text>
      </View>

      {!item.redeemed && (
        <Pressable
          onPress={() => onRedeem(item.id)}
          disabled={!canAfford}
          style={({ pressed }) => [
            styles.redeemBtn,
            {
              backgroundColor: canAfford ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.redeemBtnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
            Redeem with TrustPay
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trustPayPoints, offers, redeemOffer, transactions } = useWallet();
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", "Sports", "Stadium", "Media", "Gaming"];
  const filtered = filter === "All" ? offers : offers.filter((o) => o.category === filter);

  const rewardTxs = transactions.filter((t) => t.type === "reward").slice(0, 3);

  const handleRedeem = (id: string) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    if (trustPayPoints < offer.pointsCost) {
      Alert.alert("Not enough points", `You need ${offer.pointsCost.toLocaleString()} TrustPay points to redeem this offer.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    redeemOffer(id);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <FlatList
      data={filtered}
      keyExtractor={(o) => o.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          {/* Header */}
          <LinearGradient
            colors={["#041828", "#062040"]}
            style={[styles.headerGradient, { paddingTop: topPad + 16 }]}
          >
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rewards</Text>

            {/* Points Hero */}
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pointsHero}
            >
              <View>
                <Text style={styles.pointsHeroLabel}>TrustPay Points</Text>
                <Text style={styles.pointsHeroAmount}>{trustPayPoints.toLocaleString()}</Text>
                <Text style={styles.pointsHeroSub}>Gold Member · Earned this season</Text>
              </View>
              <MaterialCommunityIcons name="star-circle" size={64} color="rgba(255,255,255,0.25)" />
            </LinearGradient>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {[
                { label: "Points Earned", value: "3,850", icon: "arrow-up" as keyof typeof Ionicons.glyphMap },
                { label: "Points Spent", value: "1,500", icon: "arrow-down" as keyof typeof Ionicons.glyphMap },
                { label: "Offers Used", value: offers.filter(o => o.redeemed).length.toString(), icon: "checkmark" as keyof typeof Ionicons.glyphMap },
              ].map((s) => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name={s.icon} size={14} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Recent Reward History */}
          {rewardTxs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Earnings</Text>
              {rewardTxs.map((tx) => (
                <View key={tx.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.historyIcon, { backgroundColor: "#F59E0B22" }]}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                  </View>
                  <Text style={[styles.historyDesc, { color: colors.foreground }]}>
                    {tx.description}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                    {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Offers Header */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Merchant Offers</Text>
          </View>

          {/* Category Filter */}
          <FlatList
            data={categories}
            keyExtractor={(c) => c}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
            renderItem={({ item: cat }) => (
              <Pressable
                onPress={() => { setFilter(cat); Haptics.selectionAsync(); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filter === cat ? colors.primary : colors.card,
                    borderColor: filter === cat ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: filter === cat ? "#fff" : colors.mutedForeground }]}>
                  {cat}
                </Text>
              </Pressable>
            )}
          />
        </>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <OfferCard
            item={item}
            onRedeem={handleRedeem}
            canAfford={trustPayPoints >= item.pointsCost}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800" as const, fontFamily: "Inter_700Bold", marginBottom: 18 },
  pointsHero: { borderRadius: 22, padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, overflow: "hidden" },
  pointsHeroLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  pointsHeroAmount: { color: "#fff", fontSize: 42, fontWeight: "800" as const, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  pointsHeroSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { paddingHorizontal: 20, marginTop: 22, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  historyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  historyDesc: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  historyDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  offerCard: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  offerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  offerIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  offerBadgeWrap: { alignItems: "flex-end" },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  discountText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  offerMerchant: { fontSize: 16, fontFamily: "Inter_700Bold" },
  offerDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  offerFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  offerCost: { flexDirection: "row", alignItems: "center", gap: 5 },
  offerCostText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  offerExpiry: { fontSize: 12, fontFamily: "Inter_400Regular" },
  redeemBtn: { borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  redeemBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
