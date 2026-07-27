import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ClubBadge from "@/components/ClubBadge";
import { getClubById } from "@/constants/clubs";
import { getFixtureForClub, getTimeUntilMatch } from "@/constants/fixtures";
import { Transaction, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";
import { assistantApi, type AssistantNudge } from "@/utils/assistantApi";

const NUDGE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  expiring_offer: "time-outline",
  category_habit: "repeat-outline",
  inactivity: "star-outline",
};

function NudgeCard({
  nudge,
  onAccept,
  onDismiss,
}: {
  nudge: AssistantNudge;
  onAccept: (nudge: AssistantNudge) => void;
  onDismiss: (nudge: AssistantNudge) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.nudgeCard, { backgroundColor: colors.card, borderColor: `${colors.primary}44` }]}>
      <View style={styles.nudgeTop}>
        <View style={[styles.nudgeIcon, { backgroundColor: `${colors.primary}22` }]}>
          <Ionicons name={NUDGE_ICONS[nudge.kind] ?? "sparkles"} size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nudgeTitle, { color: colors.foreground }]}>{nudge.title}</Text>
          <Text style={[styles.nudgeBody, { color: colors.mutedForeground }]}>{nudge.body}</Text>
        </View>
        <Pressable
          onPress={() => onDismiss(nudge)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss suggestion"
        >
          <Ionicons name="close" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Pressable
        onPress={() => onAccept(nudge)}
        style={({ pressed }) => [styles.nudgeCta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.nudgeCtaText}>{nudge.offerId ? "View offer" : "See my rewards"}</Text>
        <Ionicons name="arrow-forward" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

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
      : `${item.amount >= 0 ? "+" : "-"}$${Math.abs(item.amount).toFixed(2)}`;

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
  const {
    authenticatedUser,
    balance,
    transactions,
    selectedClubId,
    followedClubIds,
    isRestoringSession,
    isAuthenticated,
    getCurrentUser,
    refreshWallet,
  } = useWallet();
  const selectedClub = getClubById(selectedClubId);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loyaltyExpanded, setLoyaltyExpanded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(!authenticatedUser);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [nudges, setNudges] = useState<AssistantNudge[]>([]);
  const [unseenNudges, setUnseenNudges] = useState(0);

  const loadNudges = useCallback(async () => {
    try {
      const data = await assistantApi.nudges();
      setNudges(data.nudges);
      setUnseenNudges(data.unseenCount);
    } catch {
      // The home feed stays usable when the assistant is unavailable.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      void loadNudges();
    }, [isAuthenticated, loadNudges]),
  );

  const respondToNudge = useCallback(
    (nudge: AssistantNudge, action: "accepted" | "dismissed") => {
      setNudges((prev) => prev.filter((n) => n.id !== nudge.id));
      setUnseenNudges((prev) => (nudge.status === "pending" ? Math.max(0, prev - 1) : prev));
      void assistantApi.respondToNudge(nudge.id, action).catch(() => undefined);
      if (action === "accepted") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(tabs)/rewards");
      }
    },
    [],
  );

  const markNudgesSeen = useCallback(() => {
    const pending = nudges.filter((n) => n.status === "pending");
    if (pending.length === 0) return;
    setUnseenNudges(0);
    setNudges((prev) => prev.map((n) => ({ ...n, status: "seen" as const })));
    for (const n of pending) {
      void assistantApi.respondToNudge(n.id, "seen").catch(() => undefined);
    }
  }, [nudges]);

  const fixture = getFixtureForClub(selectedClubId);
  const [matchTime, setMatchTime] = useState(() =>
    fixture ? getTimeUntilMatch(fixture.dateTime) : null
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      // Pull the current ledger whenever the user returns from a wallet flow.
      void refreshWallet().catch(() => undefined);
    }, [isAuthenticated, refreshWallet]),
  );

  useEffect(() => {
    if (!fixture) return;
    const tick = setInterval(() => setMatchTime(getTimeUntilMatch(fixture.dateTime)), 1000);
    return () => clearInterval(tick);
  }, [fixture]);

  useEffect(() => {
    if (!matchTime?.isToday && !matchTime?.isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [matchTime?.isToday, matchTime?.isLive]);

  useEffect(() => {
    if (isRestoringSession) return;
    if (authenticatedUser) {
      setProfileLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setProfileLoading(false);
      setProfileError("Your session has ended. Please sign in again.");
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    getCurrentUser()
      .then((profile) => {
        if (!active || profile) return;
        setProfileError("Your profile is unavailable. Please sign in again.");
      })
      .catch(() => {
        if (active) setProfileError("We could not load your profile. Check your connection and try again.");
      })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [authenticatedUser, getCurrentUser, isAuthenticated, isRestoringSession]);

  const recent = transactions.slice(0, 4);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
      >
        {/* Header — themed to primary club */}
        <LinearGradient
          colors={[selectedClub.gradientStart, selectedClub.gradientEnd, "#041120"] as [string, string, string]}
          style={[styles.headerGradient, { paddingTop: topPad + 16 }]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Good morning
              </Text>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {profileLoading ? "…" : authenticatedUser?.firstName ?? "Fan"}
              </Text>
              {profileError && <Text style={[styles.profileError, { color: colors.mutedForeground }]}>{profileError}</Text>}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push("/club-selector")}
                style={styles.clubBadge}
              >
                <ClubBadge club={selectedClub} size={48} />
              </Pressable>
              <Pressable
                onPress={markNudgesSeen}
                style={[styles.notifBtn, { backgroundColor: colors.card }]}
                accessibilityRole="button"
                accessibilityLabel={unseenNudges > 0 ? `${unseenNudges} new suggestions` : "Notifications"}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
                {unseenNudges > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unseenNudges > 9 ? "9+" : unseenNudges}</Text>
                  </View>
                )}
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
              <Text style={styles.balanceBrand}>Rewlo</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={balanceVisible ? "Hide balance" : "Show balance"}
                onPress={() => setBalanceVisible(!balanceVisible)}
                style={({ pressed }) => [styles.balanceVisibilityButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `${balance.toFixed(2)} RWLO` : "••••••"}
            </Text>
            <Text style={styles.balanceCurrency}>
              {balanceVisible ? `≈ $${balance.toFixed(2)} · 1 USD = 1 RWLO` : "RewLo Cash · Early Access Preview"}
            </Text>
            <View style={styles.pointsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.pointsText}>
                {profileLoading ? "Loading points…" : authenticatedUser ? `${authenticatedUser.rewloPoints.toLocaleString("en-US")} RewLo Points` : "Points unavailable"}
              </Text>
            </View>

          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            {[
              { label: "Send", icon: "arrow-up" as keyof typeof Ionicons.glyphMap, action: () => router.push("/send-money" as never) },
              { label: "Receive", icon: "arrow-down" as keyof typeof Ionicons.glyphMap, action: () => router.push("/receive-money" as never) },
              { label: "RewLo Pay", icon: "sparkles" as keyof typeof Ionicons.glyphMap, action: () => router.push("/merchant-pay" as never) },
              { label: "Top Up", icon: "add" as keyof typeof Ionicons.glyphMap, action: () => router.push("/top-up" as never) },
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

        {/* Assistant Nudges */}
        {nudges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>For you</Text>
              <Pressable onPress={() => router.push("/assistant-rules" as never)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>My rules</Text>
              </Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {nudges.slice(0, 3).map((nudge) => (
                <NudgeCard
                  key={nudge.id}
                  nudge={nudge}
                  onAccept={(n) => respondToNudge(n, "accepted")}
                  onDismiss={(n) => respondToNudge(n, "dismissed")}
                />
              ))}
            </View>
          </View>
        )}

        {/* Match Day Banner */}
        {fixture && matchTime && !matchTime.isPast && (
          <Animated.View style={[styles.section, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/matchday"); }}
            >
              <LinearGradient
                colors={[selectedClub.gradientStart, selectedClub.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.matchdayBanner}
              >
                <View style={styles.matchdayLeft}>
                  {matchTime.isLive ? (
                    <View style={styles.livePill}>
                      <View style={styles.livePillDot} />
                      <Text style={styles.livePillText}>LIVE NOW</Text>
                    </View>
                  ) : matchTime.isToday ? (
                    <View style={styles.todayPill}>
                      <Ionicons name="football-outline" size={12} color="#fff" />
                      <Text style={styles.livePillText}>MATCH DAY</Text>
                    </View>
                  ) : (
                    <View style={styles.upcomingPill}>
                      <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={[styles.livePillText, { color: "rgba(255,255,255,0.85)" }]}>UPCOMING</Text>
                    </View>
                  )}
                  <Text style={styles.matchdayFixture} numberOfLines={1}>
                    {selectedClub.shortName} vs {fixture.opponent}
                  </Text>
                  <Text style={styles.matchdayVenue} numberOfLines={1}>{fixture.venue}</Text>
                  {!matchTime.isLive && (
                    <View style={styles.matchdayCountRow}>
                      {matchTime.days > 0 && (
                        <Text style={styles.matchdayCountText}>{matchTime.days}d </Text>
                      )}
                      <Text style={styles.matchdayCountText}>
                        {String(matchTime.hours).padStart(2, "0")}h{" "}
                        {String(matchTime.minutes).padStart(2, "0")}m{" "}
                        {String(matchTime.seconds).padStart(2, "0")}s
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.matchdayRight}>
                  <View style={styles.matchdayIconCircle}>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

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
            {recent.length > 0 ? recent.map((tx) => (
              <TransactionRow key={tx.id} item={tx} />
            )) : (
              <Text style={[styles.emptyActivity, { color: colors.mutedForeground }]}>No activity yet</Text>
            )}
          </View>
        </View>

        {/* Club Loyalty Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Club Loyalty</Text>
            <Pressable onPress={() => router.push("/(tabs)/rewards")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
            </Pressable>
          </View>
          <View style={[styles.loyaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(() => {
              const allClubs = followedClubIds.length > 0 ? followedClubIds.slice(0, 2) : [selectedClubId];
              const visible = loyaltyExpanded ? allClubs : allClubs.slice(0, 1);
              return visible.map((clubId, idx) => {
                const arr = allClubs;
              const club = getClubById(clubId);
              const ptsShare = arr.length === 1 ? 1 : idx === 0 ? 0.78 : 0.22;
              const profilePoints = authenticatedUser?.rewloPoints ?? 0;
              const clubPts = Math.round(profilePoints * ptsShare);
              const maxPts = Math.round(profilePoints * (arr.length === 1 ? 1 : 0.78));
              const barPct = maxPts > 0 ? clubPts / maxPts : 0;
              const isLast = idx === visible.length - 1;
              const entry = { club, ptsShare };
              return (
                <View
                  key={entry.club.id}
                  style={[
                    styles.loyaltyRow,
                    !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <ClubBadge club={entry.club} size={52} />
                  <View style={styles.loyaltyInfo}>
                    <View style={styles.loyaltyTopRow}>
                      <Text style={[styles.loyaltyClubName, { color: colors.foreground }]}>
                        {entry.club.shortName}
                      </Text>
                      <View style={[styles.loyaltyLeaguePill, { backgroundColor: `${entry.club.accentColor}22`, borderColor: `${entry.club.accentColor}44` }]}>
                        <Text style={[styles.loyaltyLeagueText, { color: entry.club.accentColor }]}>
                          {entry.club.league}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.loyaltyPts, { color: entry.club.accentColor }]}>
                      {clubPts.toLocaleString()} pts
                    </Text>
                    <View style={[styles.loyaltyBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.loyaltyBarFill, { width: `${Math.round(barPct * 100)}%`, backgroundColor: entry.club.accentColor }]} />
                    </View>
                    <Text style={[styles.loyaltySub, { color: colors.mutedForeground }]}>
                      {entry.club.name}
                    </Text>
                  </View>
                </View>
              );
              });
            })()}
            {(followedClubIds.length > 1) && (
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
        </View>
      </ScrollView>

      {/* Ask assistant bubble */}
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/assistant-chat" as never); }}
        style={({ pressed }) => [
          styles.askBubble,
          { backgroundColor: colors.primary, bottom: (Platform.OS === "web" ? 90 : insets.bottom + 90), opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Ask the RewLo assistant"
      >
        <Ionicons name="sparkles" size={18} color="#fff" />
        <Text style={styles.askBubbleText}>Ask</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  profileError: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3, maxWidth: 220 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  clubBadge: { borderRadius: 24, overflow: "hidden", borderWidth: 2, borderColor: "rgba(0,229,204,0.7)" },
  emptyActivity: { padding: 20, textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular" },
  notifBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  notifBadge: { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notifBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
  nudgeCard: { borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 12 },
  nudgeTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  nudgeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  nudgeTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  nudgeBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  nudgeCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 10 },
  nudgeCtaText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  askBubble: { position: "absolute", left: 20, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 13, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  askBubbleText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  balanceCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    position: "relative",
    overflow: "hidden",
  },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  balanceBrand: { color: "#00E5CC", fontSize: 20, fontWeight: "800" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  balanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  balanceAmount: { color: "#FFFFFF", fontSize: 42, fontWeight: "800" as const, fontFamily: "Inter_700Bold", letterSpacing: -1, marginBottom: 2 },
  balanceCurrency: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.2)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pointsText: { color: "#F59E0B", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  balanceVisibilityButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
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
  matchdayBanner: { borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center" },
  matchdayLeft: { flex: 1, gap: 5 },
  matchdayRight: { paddingLeft: 12 },
  matchdayIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  matchdayFixture: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  matchdayVenue: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  matchdayCountRow: { flexDirection: "row" },
  matchdayCountText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EF4444", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  livePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  livePillText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  todayPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  upcomingPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  loyaltyCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  loyaltyExpandBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  loyaltyExpandText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loyaltyRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  loyaltyInfo: { flex: 1, gap: 5 },
  loyaltyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  loyaltyClubName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  loyaltyLeaguePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  loyaltyLeagueText: { fontSize: 9, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  loyaltyPts: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  loyaltyBarBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  loyaltyBarFill: { height: 5, borderRadius: 3 },
  loyaltySub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#1A3A5C", alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular" },
  modalBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
