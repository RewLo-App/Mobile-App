import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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

import { ApiErrorDialog } from "@/components/ApiErrorDialog";
import ClubBadge from "@/components/ClubBadge";
import { getClubById } from "@/constants/clubs";
import { Offer, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";
import { apiErrorMessage } from "@/utils/walletApi";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Sports: "football-outline",
  Stadium: "business-outline",
  Media: "tv-outline",
  Gaming: "game-controller-outline",
};

interface Milestone {
  points: number;
  tier: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  perk: string;
}

const MILESTONES: Milestone[] = [
  { points: 0,     tier: "Bronze",   icon: "shield-outline",       color: "#CD7F32", perk: "Fan member status" },
  { points: 1000,  tier: "Silver",   icon: "shield-half-outline",  color: "#A0AEC0", perk: "2% cashback on all purchases" },
  { points: 2500,  tier: "Gold",     icon: "shield",               color: "#F59E0B", perk: "Priority stadium access" },
  { points: 5000,  tier: "Platinum", icon: "star-outline",         color: "#E2E8F0", perk: "Club jersey 15% discount" },
  { points: 10000, tier: "Diamond",  icon: "diamond-outline",      color: "#67E8F9", perk: "VIP matchday experience" },
];

function getCurrentTierIndex(pts: number): number {
  let idx = 0;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (pts >= MILESTONES[i].points) idx = i;
    else break;
  }
  return idx;
}

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
            Redeem with Rewlo
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rewloPoints, rewardStats, offers, redeemOffer, refreshWallet, transactions, followedClubIds, selectedClubId } = useWallet();
  const [filter, setFilter] = useState<string>("All");
  const [loyaltyExpanded, setLoyaltyExpanded] = useState(false);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try { await refreshWallet(); }
    catch (error) { setCatalogError(apiErrorMessage(error, "Could not load offers.")); }
    finally { setCatalogLoading(false); }
  };
  useEffect(() => { void loadCatalog(); }, [refreshWallet]);

  const categories = ["All", ...Array.from(new Set(offers.map((offer) => offer.category)))];
  const filtered = (filter === "All" ? offers : offers.filter((o) => o.category === filter)).slice(0, 5);
  const rewardTxs = transactions.filter((t) => t.type === "reward").slice(0, 3);

  const currentTierIdx = getCurrentTierIndex(rewloPoints);
  const currentMilestone = MILESTONES[currentTierIdx];
  const nextMilestone = MILESTONES[currentTierIdx + 1] ?? null;
  const prevPoints = currentMilestone.points;
  const nextPoints = nextMilestone?.points ?? currentMilestone.points;
  const progressPct = nextMilestone
    ? Math.min(1, (rewloPoints - prevPoints) / (nextPoints - prevPoints))
    : 1;
  const ptsToNext = nextMilestone ? nextMilestone.points - rewloPoints : 0;

  const handleRedeem = async (id: string) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    if (rewloPoints < offer.pointsCost) {
      Alert.alert("Not enough points", `You need ${offer.pointsCost.toLocaleString()} Rewlo points to redeem this offer.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await redeemOffer(id); }
    catch (error) { setRedemptionError(apiErrorMessage(error, "Please try again.")); }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <>
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
                <Text style={styles.pointsHeroLabel}>Rewlo Points</Text>
                <Text style={styles.pointsHeroAmount}>{rewloPoints.toLocaleString()}</Text>
                <Text style={styles.pointsHeroSub}>{currentMilestone.tier} Member · Earned this season</Text>
              </View>
              <MaterialCommunityIcons name="star-circle" size={64} color="rgba(255,255,255,0.25)" />
            </LinearGradient>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {[
                { label: "Points Earned", value: rewardStats.pointsEarned.toLocaleString(), icon: "arrow-up" as keyof typeof Ionicons.glyphMap },
                { label: "Points Spent", value: rewardStats.pointsSpent.toLocaleString(), icon: "arrow-down" as keyof typeof Ionicons.glyphMap },
                { label: "Offers Used", value: rewardStats.offersUsed.toLocaleString(), icon: "checkmark" as keyof typeof Ionicons.glyphMap },
              ].map((s) => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name={s.icon} size={14} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* ── Club Loyalty card ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Club Loyalty</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Your Rewlo points across all supported clubs
            </Text>
          </View>
          <View style={[styles.clubLoyaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(() => {
              const allClubs = followedClubIds.length > 0 ? followedClubIds.slice(0, 2) : [selectedClubId];
              const visible = loyaltyExpanded ? allClubs : allClubs.slice(0, 1);
              return visible.map((clubId, idx) => {
                const arr = allClubs;
              const club = getClubById(clubId);
              const ptsShare = arr.length === 1 ? 1 : idx === 0 ? 0.78 : 0.22;
              const clubPts = Math.round(rewloPoints * ptsShare);
              const maxPts = Math.round(rewloPoints * (arr.length === 1 ? 1 : 0.78));
              const barPct = maxPts > 0 ? clubPts / maxPts : 0;
              const isLast = idx === visible.length - 1;
              const entry = { club, ptsShare };
              return (
                <View
                  key={entry.club.id}
                  style={[
                    styles.clubLoyaltyRow,
                    !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  {/* Badge */}
                  <ClubBadge club={entry.club} size={56} />

                  {/* Info */}
                  <View style={styles.clubLoyaltyInfo}>
                    <View style={styles.clubLoyaltyTopRow}>
                      <Text style={[styles.clubLoyaltyName, { color: colors.foreground }]}>
                        {entry.club.shortName}
                      </Text>
                      <View style={[styles.leaguePill, { backgroundColor: `${entry.club.accentColor}22`, borderColor: `${entry.club.accentColor}44` }]}>
                        <Text style={[styles.leaguePillText, { color: entry.club.accentColor }]}>
                          {entry.club.league}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.clubLoyaltyPts, { color: entry.club.accentColor }]}>
                      {clubPts.toLocaleString()} pts
                    </Text>
                    {/* Mini progress bar */}
                    <View style={[styles.clubBarBg, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.clubBarFill,
                          { width: `${Math.round(barPct * 100)}%`, backgroundColor: entry.club.accentColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.clubLoyaltySub, { color: colors.mutedForeground }]}>
                      {entry.club.name}
                    </Text>
                  </View>
                </View>
              );
              });
            })()}
            {followedClubIds.length > 1 && (
              <Pressable
                onPress={() => setLoyaltyExpanded((v) => !v)}
                style={[styles.loyaltyExpandBtn, { borderTopColor: colors.border }]}
              >
                <Text style={[styles.loyaltyExpandText, { color: colors.primary }]}>
                  {loyaltyExpanded ? "Hide other clubs" : "Show other clubs"}
                </Text>
                <Ionicons name={loyaltyExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {/* Rewlo Milestones */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Loyalty Milestones</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Earn points to unlock exclusive perks
            </Text>
          </View>

          {/* Progress to next tier */}
          {nextMilestone && (
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.progressTop}>
                <View style={styles.progressTierRow}>
                  <View style={[styles.tierDot, { backgroundColor: currentMilestone.color }]} />
                  <Text style={[styles.progressTierLabel, { color: colors.foreground }]}>
                    {currentMilestone.tier}
                  </Text>
                </View>
                <Text style={[styles.progressPts, { color: colors.mutedForeground }]}>
                  {ptsToNext.toLocaleString()} pts to {nextMilestone.tier}
                </Text>
                <View style={styles.progressTierRow}>
                  <View style={[styles.tierDot, { backgroundColor: nextMilestone.color }]} />
                  <Text style={[styles.progressTierLabel, { color: colors.foreground }]}>
                    {nextMilestone.tier}
                  </Text>
                </View>
              </View>
              {/* Bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <LinearGradient
                  colors={[currentMilestone.color, nextMilestone.color]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${Math.round(progressPct * 100)}%` }]}
                />
              </View>
              <View style={styles.progressPtRow}>
                <Text style={[styles.progressPtLabel, { color: colors.mutedForeground }]}>
                  {rewloPoints.toLocaleString()} pts
                </Text>
                <Text style={[styles.progressPtLabel, { color: colors.mutedForeground }]}>
                  {nextMilestone.points.toLocaleString()} pts
                </Text>
              </View>
              <View style={[styles.perkRow, { backgroundColor: `${nextMilestone.color}18`, borderColor: `${nextMilestone.color}40` }]}>
                <Ionicons name="gift-outline" size={14} color={nextMilestone.color} />
                <Text style={[styles.perkText, { color: colors.foreground }]}>
                  Unlock at {nextMilestone.tier}:{" "}
                  <Text style={{ color: nextMilestone.color, fontFamily: "Inter_600SemiBold" }}>
                    {nextMilestone.perk}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* All milestones ladder */}
          <View style={[styles.milestoneLadder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {MILESTONES.map((m, i) => {
              const isReached = rewloPoints >= m.points;
              const isCurrent = i === currentTierIdx;
              const isLast = i === MILESTONES.length - 1;
              return (
                <View key={m.tier} style={[styles.milestoneRow, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  {/* Timeline */}
                  <View style={styles.milestoneTimeline}>
                    <View style={[
                      styles.milestoneDot,
                      isReached ? { backgroundColor: m.color, borderColor: m.color } : { backgroundColor: "transparent", borderColor: colors.border },
                      isCurrent && styles.milestoneCurrentDot,
                    ]}>
                      {isReached && <Ionicons name="checkmark" size={10} color={isCurrent ? "#000" : "#fff"} />}
                    </View>
                    {!isLast && (
                      <View style={[styles.milestoneLine, { backgroundColor: isReached ? m.color : colors.border }]} />
                    )}
                  </View>
                  {/* Content */}
                  <View style={styles.milestoneContent}>
                    <View style={styles.milestoneTitleRow}>
                      <View style={[styles.milestoneTierBadge, { backgroundColor: `${m.color}22`, borderColor: `${m.color}44` }]}>
                        <Ionicons name={m.icon} size={12} color={m.color} />
                        <Text style={[styles.milestoneTierText, { color: m.color }]}>{m.tier}</Text>
                      </View>
                      <Text style={[styles.milestonePts, { color: isReached ? m.color : colors.mutedForeground }]}>
                        {m.points.toLocaleString()} pts
                      </Text>
                    </View>
                    <Text style={[styles.milestonePerk, { color: isReached ? colors.foreground : colors.mutedForeground }]}>
                      {m.perk}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: `${m.color}22` }]}>
                        <Text style={[styles.currentBadgeText, { color: m.color }]}>Current tier</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

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
            canAfford={rewloPoints >= item.pointsCost}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.catalogState}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            {catalogLoading ? "Loading offers…" : catalogError ?? "No offers are available right now."}
          </Text>
          {catalogError && (
            <Pressable onPress={() => void loadCatalog()} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          )}
        </View>
      }
    />
    <ApiErrorDialog message={redemptionError} onClose={() => setRedemptionError(null)} title="Redemption failed" />
    </>
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
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  progressCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 18, gap: 12, marginBottom: 14 },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTierRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  progressTierLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressPts: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressPtRow: { flexDirection: "row", justifyContent: "space-between" },
  progressPtLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  perkText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  milestoneLadder: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  milestoneRow: { flexDirection: "row", padding: 16, gap: 14 },
  milestoneTimeline: { alignItems: "center", width: 20 },
  milestoneDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  milestoneCurrentDot: { width: 22, height: 22, borderRadius: 11 },
  milestoneLine: { width: 2, flex: 1, marginTop: 4, minHeight: 16 },
  milestoneContent: { flex: 1, gap: 4 },
  milestoneTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  milestoneTierBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  milestoneTierText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  milestonePts: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  milestonePerk: { fontSize: 13, fontFamily: "Inter_400Regular" },
  currentBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 2 },
  currentBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
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
  catalogState: { paddingHorizontal: 20, paddingTop: 26, alignItems: "center", gap: 14 },
  retryButton: { height: 42, paddingHorizontal: 22, borderRadius: 12, justifyContent: "center" },
  retryText: { color: "#fff", fontFamily: "Inter_700Bold" },
  clubLoyaltyCard: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  loyaltyExpandBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  loyaltyExpandText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  clubLoyaltyRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  clubLoyaltyInfo: { flex: 1, gap: 5 },
  clubLoyaltyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clubLoyaltyName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  leaguePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  leaguePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  clubLoyaltyPts: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  clubBarBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  clubBarFill: { height: 5, borderRadius: 3 },
  clubLoyaltySub: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
