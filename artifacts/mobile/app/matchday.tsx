import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { getClubById } from "@/constants/clubs";
import { Fixture, StadiumOption, getFixtureForClub, getTimeUntilMatch } from "@/constants/fixtures";
import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isToday: boolean;
  isLive: boolean;
  isPast: boolean;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countBlock}>
      <View style={styles.countInner}>
        <Text style={styles.countValue}>{String(value).padStart(2, "0")}</Text>
      </View>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

interface StadiumTileProps {
  option: StadiumOption;
  clubGradient: [string, string];
  onPress: () => void;
}

function StadiumTile({ option, clubGradient, onPress }: StadiumTileProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stadiumTile,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <LinearGradient colors={clubGradient} style={styles.tileIconWrap}>
        <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
      </LinearGradient>
      <Text style={[styles.tileLabel, { color: colors.foreground }]} numberOfLines={2}>
        {option.label}
      </Text>
      <Text style={[styles.tileAmount, { color: colors.mutedForeground }]}>
        ${option.amount.toFixed(2)}
      </Text>
    </Pressable>
  );
}

export default function MatchdayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedClubId, addTransaction } = useWallet();
  const club = getClubById(selectedClubId);
  const fixture = getFixtureForClub(selectedClubId);

  const [countdown, setCountdown] = useState<CountdownState>(() => {
    if (!fixture) return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false, isLive: false, isPast: false };
    return getTimeUntilMatch(fixture.dateTime);
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fixture) return;
    const tick = setInterval(() => {
      setCountdown(getTimeUntilMatch(fixture.dateTime));
    }, 1000);
    return () => clearInterval(tick);
  }, [fixture]);

  useEffect(() => {
    if (countdown.isLive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    }
  }, [countdown.isLive]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!fixture) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.closeRow, { top: topPad + 12 }]}>
          <Pressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Ionicons name="football-outline" size={52} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Upcoming Match</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Check back closer to your next fixture.</Text>
        </View>
      </View>
    );
  }

  const gradientColors: [string, string] = [club.gradientStart, club.gradientEnd];

  const handleStadiumPay = (option: StadiumOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTransaction({
      type: "payment",
      amount: -option.amount,
      description: `${option.label} at ${fixture.venue}`,
      merchant: fixture.venue,
      status: "completed",
      clubTag: club.abbreviation,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const matchDate = new Date(fixture.dateTime);
  const dateStr = matchDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const timeStr = matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 30 }}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPad + 16 }]}
        >
          {/* Close */}
          <View style={styles.heroTopRow}>
            <Pressable onPress={() => router.back()} style={styles.heroCloseBtn}>
              <Ionicons name="chevron-down" size={24} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <View style={styles.competitionBadge}>
              <Ionicons name="trophy-outline" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.competitionText}>{fixture.competition}</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Match Header */}
          <View style={styles.matchHeader}>
            {/* Home Club */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Text style={styles.teamAbbrv}>{fixture.isHome ? club.abbreviation : fixture.opponentAbbr}</Text>
              </View>
              <Text style={styles.teamName} numberOfLines={2}>
                {fixture.isHome ? club.shortName : fixture.opponent}
              </Text>
            </View>

            {/* VS */}
            <View style={styles.vsBlock}>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.matchweek}>{fixture.matchweek}</Text>
            </View>

            {/* Away Club */}
            <View style={styles.teamBlock}>
              <View style={[styles.teamBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Text style={styles.teamAbbrv}>{fixture.isHome ? fixture.opponentAbbr : club.abbreviation}</Text>
              </View>
              <Text style={styles.teamName} numberOfLines={2}>
                {fixture.isHome ? fixture.opponent : club.shortName}
              </Text>
            </View>
          </View>

          {/* Venue */}
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.venueText}>{fixture.venue}, {fixture.city}</Text>
          </View>
          <Text style={styles.matchDateText}>{dateStr} · {timeStr}</Text>

          {/* Live badge */}
          {countdown.isLive && (
            <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </Animated.View>
          )}
        </LinearGradient>

        {/* Countdown */}
        {!countdown.isLive && !countdown.isPast && (
          <View style={[styles.countdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countdownTitle, { color: colors.mutedForeground }]}>
              {countdown.isToday ? "KICK-OFF TODAY IN" : "KICK-OFF IN"}
            </Text>
            <View style={styles.countdownRow}>
              {countdown.days > 0 && <CountdownBlock value={countdown.days} label="DAYS" />}
              {countdown.days > 0 && <Text style={[styles.countSep, { color: club.gradientStart }]}>:</Text>}
              <CountdownBlock value={countdown.hours} label="HRS" />
              <Text style={[styles.countSep, { color: club.gradientStart }]}>:</Text>
              <CountdownBlock value={countdown.minutes} label="MIN" />
              <Text style={[styles.countSep, { color: club.gradientStart }]}>:</Text>
              <CountdownBlock value={countdown.seconds} label="SEC" />
            </View>
          </View>
        )}

        {countdown.isLive && (
          <LinearGradient
            colors={gradientColors}
            style={styles.liveCard}
          >
            <Ionicons name="radio-outline" size={22} color="#fff" />
            <Text style={styles.liveCardText}>Match is LIVE — Open stadium wallet to pay</Text>
          </LinearGradient>
        )}

        {/* Match Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoTitle}>
            <Ionicons name="information-circle-outline" size={18} color={club.gradientStart} />
            <Text style={[styles.infoTitleText, { color: colors.foreground }]}>Match Details</Text>
          </View>
          {[
            { label: "Competition", value: fixture.competition },
            { label: "Round", value: fixture.matchweek },
            { label: "Venue", value: fixture.venue },
            { label: "Location", value: fixture.city },
            { label: "Date", value: dateStr },
            { label: "Kick-off", value: timeStr },
          ].map((r, i, arr) => (
            <View
              key={r.label}
              style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
            >
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Entry Pass */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stadium Entry Pass</Text>
        </View>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.entryPass}
        >
          <View style={styles.passLeft}>
            <Text style={styles.passLabel}>MATCH TICKET</Text>
            <Text style={styles.passName}>{club.shortName}</Text>
            <Text style={styles.passVenue}>{fixture.venue}</Text>
            <Text style={styles.passDate}>{timeStr} · {matchDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
          </View>
          <View style={styles.passDivider} />
          <View style={styles.passRight}>
            <View style={styles.barcode}>
              {Array.from({ length: 18 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      height: [24, 16, 28, 20, 24, 12, 28, 18, 24, 16, 28, 20, 14, 26, 20, 28, 16, 22][i],
                      width: i % 3 === 0 ? 3 : 2,
                      backgroundColor: "rgba(255,255,255,0.9)",
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.barcodeRef}>{fixture.id.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Stadium Wallet */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stadium Wallet</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Pay instantly at {fixture.isHome ? "the" : ""} {fixture.venue}
          </Text>
        </View>

        <View style={styles.tilesGrid}>
          {fixture.stadiumOptions.map((option) => (
            <StadiumTile
              key={option.label}
              option={option}
              clubGradient={gradientColors}
              onPress={() => handleStadiumPay(option)}
            />
          ))}
        </View>

        {/* Full Scan to Pay */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/scan"); }}
          style={({ pressed }) => [styles.scanBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanBtnGrad}>
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.scanBtnText}>Scan to Pay at {fixture.venue}</Text>
          </LinearGradient>
        </Pressable>

        {/* Rewlo earn note */}
        <View style={[styles.earnNote, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B33" }]}>
          <Ionicons name="star-outline" size={16} color="#F59E0B" />
          <Text style={[styles.earnNoteText, { color: colors.mutedForeground }]}>
            Earn <Text style={{ color: "#F59E0B", fontFamily: "Inter_600SemiBold" }}>2x Rewlo Points</Text> on all stadium purchases today
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeRow: { position: "absolute", left: 20, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },

  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  heroCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  competitionBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  competitionText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontFamily: "Inter_600SemiBold" },

  matchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  teamBlock: { flex: 1, alignItems: "center", gap: 10 },
  teamBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  teamAbbrv: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textAlign: "center" },
  teamName: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  vsBlock: { alignItems: "center", gap: 4, paddingHorizontal: 12 },
  vsText: { color: "rgba(255,255,255,0.5)", fontSize: 20, fontFamily: "Inter_700Bold" },
  matchweek: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_500Medium" },

  venueRow: { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", marginBottom: 4 },
  venueText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium" },
  matchDateText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },

  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF4444", alignSelf: "center", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  countdownCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, borderWidth: 1, padding: 22, alignItems: "center" },
  countdownTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 16 },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBlock: { alignItems: "center", gap: 8 },
  countInner: { minWidth: 64, height: 64, borderRadius: 14, backgroundColor: "rgba(37,99,235,0.15)", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  countValue: { color: "#FFFFFF", fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  countLabel: { color: "#6B8BAE", fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  countSep: { fontSize: 28, fontFamily: "Inter_700Bold", marginTop: -16 },

  liveCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  liveCardText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },

  infoCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  infoTitle: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 12 },
  infoTitleText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 20 },

  sectionHeader: { marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },

  entryPass: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", flexDirection: "row", minHeight: 110 },
  passLeft: { flex: 1, padding: 18, gap: 3 },
  passLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  passName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  passVenue: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular" },
  passDate: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_500Medium" },
  passDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 14 },
  passRight: { padding: 16, alignItems: "center", justifyContent: "center", gap: 6 },
  barcode: { flexDirection: "row", alignItems: "flex-end", gap: 2.5 },
  bar: { borderRadius: 1 },
  barcodeRef: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontFamily: "Inter_500Medium", letterSpacing: 1 },

  tilesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12 },
  stadiumTile: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  tileIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tileAmount: { fontSize: 13, fontFamily: "Inter_500Medium" },

  scanBtn: { marginHorizontal: 20, marginTop: 20, borderRadius: 18, overflow: "hidden" },
  scanBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  scanBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  earnNote: { marginHorizontal: 20, marginTop: 14, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  earnNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
