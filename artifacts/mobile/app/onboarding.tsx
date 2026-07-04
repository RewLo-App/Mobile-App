import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ClubBadge from "@/components/ClubBadge";
import { Club, CLUBS, SOCCER_LEAGUES } from "@/constants/clubs";
import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "Soccer"];

function getClubsForLeague(league: string): Club[] {
  if (league === "Soccer") return CLUBS.filter((c) => SOCCER_LEAGUES.includes(c.league));
  return CLUBS.filter((c) => c.league === league);
}

function validateEmail(val: string): boolean {
  return /\S+@\S+\.\S+/.test(val);
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useWallet();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [activeLeague, setActiveLeague] = useState("NFL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const btmPad = Platform.OS === "web" ? 34 : insets.bottom;

  const clubsForLeague = getClubsForLeague(activeLeague);
  const primaryId = selectedIds[0] ?? null;

  const handleContinue = () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(2);
  };

  const toggleClub = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGetStarted = async () => {
    if (selectedIds.length === 0 || loading) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding(email, selectedIds[0], selectedIds);
    router.replace("/(tabs)/home");
  };

  const handleDemo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding("demo@rewlo.io", "man-city", ["man-city", "stl-cardinals"]);
    router.replace("/(tabs)/home");
  };

  if (step === 1) {
    return (
      <LinearGradient colors={["#020D1E", "#041828", "#062040"]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <View style={[styles.container, { paddingTop: topPad + 20, paddingBottom: btmPad + 20 }]}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={[styles.logo, { backgroundColor: "#2563EB" }]}>
                <Text style={styles.logoLetter}>R</Text>
              </View>
              <Text style={styles.brand}>Rewlo</Text>
              <Text style={styles.tagline}>Your Sports Fan Wallet</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF" }]}>Create your account</Text>
              <Text style={[styles.stepSub, { color: "#6B8BAE" }]}>
                Enter your email to get started — no password needed
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  {
                    borderColor: emailError ? "#EF4444" : "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#6B8BAE" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: "#FFFFFF" }]}
                  placeholder="Email address"
                  placeholderTextColor="#6B8BAE"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={Platform.OS !== "web"}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>

              {emailError.length > 0 && (
                <Text style={styles.errorText}>{emailError}</Text>
              )}

              <Pressable
                onPress={handleContinue}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: "#2563EB", opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.btnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>

              <Pressable onPress={handleDemo} style={styles.demoBtn}>
                <Text style={styles.demoBtnText}>Try demo mode</Text>
              </Pressable>
            </View>

            {/* Step dots */}
            <View style={styles.dotsRow}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotInactive]} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#020D1E", "#041828", "#062040"]} style={styles.gradient}>
      <View style={[styles.flex, { paddingTop: topPad + 8 }]}>
        {/* Header */}
        <View style={styles.step2Header}>
          <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.step2TitleWrap}>
            <Text style={styles.step2Title}>Pick your teams</Text>
            <Text style={styles.step2Sub}>
              {selectedIds.length === 0
                ? "Select all the clubs you follow"
                : `${selectedIds.length} club${selectedIds.length > 1 ? "s" : ""} selected`}
            </Text>
          </View>
        </View>

        {/* Step dots */}
        <View style={[styles.dotsRow, { paddingHorizontal: 24, marginTop: 4 }]}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* League tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueTabs}
        >
          {LEAGUES.map((league) => {
            const active = activeLeague === league;
            const count = selectedIds.filter((id) =>
              getClubsForLeague(league).some((c) => c.id === id)
            ).length;
            return (
              <Pressable
                key={league}
                onPress={() => {
                  setActiveLeague(league);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.leagueTab,
                  active
                    ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                    : { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" },
                ]}
              >
                <Text
                  style={[
                    styles.leagueTabText,
                    { color: active ? "#fff" : "#6B8BAE" },
                  ]}
                >
                  {league}
                </Text>
                {count > 0 && (
                  <View style={styles.leagueCountBadge}>
                    <Text style={styles.leagueCountText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Club grid */}
        <FlatList
          key={activeLeague}
          data={clubsForLeague}
          keyExtractor={(c) => c.id}
          numColumns={2}
          contentContainerStyle={styles.clubGrid}
          columnWrapperStyle={styles.clubRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            const isPrimary = item.id === primaryId;
            return (
              <Pressable
                onPress={() => toggleClub(item.id)}
                style={({ pressed }) => [
                  styles.clubCard,
                  {
                    backgroundColor: selected
                      ? `${item.accentColor}18`
                      : "rgba(255,255,255,0.04)",
                    borderColor: selected
                      ? item.accentColor
                      : "rgba(255,255,255,0.10)",
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                {/* Primary or check badge */}
                {isPrimary && (
                  <View
                    style={[
                      styles.cornerBadge,
                      { backgroundColor: item.accentColor },
                    ]}
                  >
                    <Ionicons name="star" size={9} color="#000" />
                  </View>
                )}
                {selected && !isPrimary && (
                  <View
                    style={[
                      styles.cornerBadge,
                      { backgroundColor: item.accentColor },
                    ]}
                  >
                    <Ionicons name="checkmark" size={9} color="#000" />
                  </View>
                )}

                <ClubBadge club={item} size={50} />
                <Text
                  style={[
                    styles.clubName,
                    { color: selected ? "#FFFFFF" : "#CBD5E1" },
                  ]}
                  numberOfLines={1}
                >
                  {item.shortName}
                </Text>
                {isPrimary && (
                  <Text style={[styles.primaryLabel, { color: item.accentColor }]}>
                    Primary
                  </Text>
                )}
              </Pressable>
            );
          }}
        />

        {/* CTA footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: btmPad + 16, borderTopColor: "rgba(255,255,255,0.08)" },
          ]}
        >
          {selectedIds.length > 0 && (
            <Text style={styles.selectionHint}>
              First selected is your primary · tap again to remove
            </Text>
          )}
          <Pressable
            onPress={handleGetStarted}
            disabled={selectedIds.length === 0 || loading}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor:
                  selectedIds.length > 0 ? "#2563EB" : "rgba(255,255,255,0.1)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                { color: selectedIds.length > 0 ? "#fff" : "#6B8BAE" },
              ]}
            >
              {loading ? "Setting up your wallet…" : "Get Started"}
            </Text>
            {!loading && selectedIds.length > 0 && (
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  logoWrap: { alignItems: "center", paddingTop: 20 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoLetter: { fontSize: 36, fontWeight: "800" as const, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  brand: { fontSize: 28, fontWeight: "800" as const, color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: "#6B8BAE", marginTop: 6, fontFamily: "Inter_400Regular" },
  form: { gap: 14 },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4, lineHeight: 20 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  errorText: { color: "#EF4444", fontSize: 13, fontFamily: "Inter_400Regular" },
  btn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontSize: 17, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  demoBtn: { alignItems: "center", paddingVertical: 10 },
  demoBtnText: { color: "#6B8BAE", fontSize: 14, fontFamily: "Inter_500Medium" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: "#2563EB" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.15)" },
  step2Header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  step2TitleWrap: { flex: 1 },
  step2Title: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF", fontWeight: "700" as const },
  step2Sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8BAE", marginTop: 2 },
  leagueTabs: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 12,
  },
  leagueTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  leagueTabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  leagueCountBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  leagueCountText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  clubGrid: { paddingHorizontal: 16, paddingBottom: 16 },
  clubRow: { gap: 12, marginBottom: 12 },
  clubCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  cornerBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clubName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" as const },
  primaryLabel: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  selectionHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6B8BAE",
    textAlign: "center" as const,
  },
});
