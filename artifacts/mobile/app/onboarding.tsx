import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
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
import { Club, CLUB_LOGO_URLS, CLUBS } from "@/constants/clubs";
import { useWallet } from "@/context/WalletContext";

// ── US-only leagues ───────────────────────────────────────────────
const US_LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS"] as const;
type UsLeague = (typeof US_LEAGUES)[number];

const US_CLUBS = CLUBS.filter((c) => (US_LEAGUES as readonly string[]).includes(c.league));

function getClubsByLeague(league: UsLeague): Club[] {
  return US_CLUBS.filter((c) => c.league === league);
}

// ── Shared style constants ────────────────────────────────────────
const BG_DARK = "#020D1E";
const CARD_BG = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.10)";
const MUTED = "#6B8BAE";
const PRIMARY = "#2563EB";
const WHITE = "#FFFFFF";

// ── Progress bar ─────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <View style={pb.row}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            pb.seg,
            { backgroundColor: s <= step ? PRIMARY : "rgba(255,255,255,0.15)" },
          ]}
        />
      ))}
    </View>
  );
}
const pb = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, paddingHorizontal: 24, marginBottom: 20 },
  seg: { flex: 1, height: 3, borderRadius: 3 },
});

// ── Rewlo Logo (placeholder – swap when logo file is provided) ────
function RewloLogo() {
  return (
    <View style={logo.wrap}>
      <View style={logo.icon}>
        {/* Replace this View + Text with an <Image> once logo file is provided */}
        <Text style={logo.letter}>R</Text>
      </View>
      <Text style={logo.wordmark}>Rewlo</Text>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, marginBottom: 8 },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { fontSize: 34, fontWeight: "800" as const, color: WHITE },
  wordmark: { fontSize: 26, fontWeight: "800" as const, color: WHITE, letterSpacing: -0.5 },
});

// ═════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [primaryLeague, setPrimaryLeague] = useState<UsLeague>("NFL");
  const [primaryClubId, setPrimaryClubId] = useState<string | null>(null);

  // Step 2 state
  const [followsOther, setFollowsOther] = useState<boolean | null>(null);
  const [otherLeague, setOtherLeague] = useState<UsLeague>("NFL");
  const [otherClubId, setOtherClubId] = useState<string | null>(null);

  // Step 3 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zip, setZip] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; zip?: string }>({});
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 52 : insets.top;
  const btmPad = Platform.OS === "web" ? 24 : insets.bottom;

  // Step 1: clubs available for this league
  const step1Clubs = getClubsByLeague(primaryLeague);
  // Step 2: clubs excluding primary
  const step2Clubs = getClubsByLeague(otherLeague).filter((c) => c.id !== primaryClubId);

  // ── Handlers ──────────────────────────────────────────────────
  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => (s === 2 ? 1 : 2) as 1 | 2 | 3);
  };

  const handleStep1Next = () => {
    if (!primaryClubId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Reset step 2 if coming back
    if (otherClubId === primaryClubId) setOtherClubId(null);
    setStep(2);
  };

  const handleToggle = (val: boolean) => {
    Haptics.selectionAsync();
    setFollowsOther(val);
    if (!val) setOtherClubId(null);
  };

  const handleStep2Next = () => {
    if (followsOther === null) return;
    if (followsOther && !otherClubId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(3);
  };

  const validateStep3 = () => {
    const e: typeof errors = {};
    if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!/^\d{5}$/.test(zip)) e.zip = "Enter a valid 5-digit ZIP code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateStep3() || loading) return;
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const followed = [primaryClubId!, ...(followsOther && otherClubId ? [otherClubId] : [])];
    await completeOnboarding(email, primaryClubId!, followed);
    router.replace("/(tabs)/home");
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <LinearGradient colors={[BG_DARK, "#041828", "#062040"]} style={s.gradient}>
      <View style={[s.root, { paddingTop: topPad + 10, paddingBottom: btmPad }]}>
        {/* Back button (steps 2 & 3) */}
        {step > 1 && (
          <Pressable onPress={goBack} style={[s.backBtn, { top: topPad + 14 }]}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </Pressable>
        )}

        <ProgressBar step={step} />

        {step === 1 && <Step1
          leagues={US_LEAGUES}
          activeLeague={primaryLeague}
          setActiveLeague={setPrimaryLeague}
          clubs={step1Clubs}
          selectedId={primaryClubId}
          onSelect={(id) => { Haptics.selectionAsync(); setPrimaryClubId(id); }}
          onNext={handleStep1Next}
          btmPad={btmPad}
        />}

        {step === 2 && primaryClubId && <Step2
          followsOther={followsOther}
          onToggle={handleToggle}
          leagues={US_LEAGUES}
          activeLeague={otherLeague}
          setActiveLeague={setOtherLeague}
          clubs={step2Clubs}
          selectedId={otherClubId}
          onSelect={(id) => { Haptics.selectionAsync(); setOtherClubId(id); }}
          onNext={handleStep2Next}
          btmPad={btmPad}
        />}

        {step === 3 && <Step3
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          zip={zip} setZip={setZip}
          showPassword={showPassword} setShowPassword={setShowPassword}
          errors={errors}
          loading={loading}
          onSubmit={handleCreateAccount}
          btmPad={btmPad}
        />}
      </View>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 1 — Primary club
// ═══════════════════════════════════════════════════════════════
function Step1({
  leagues, activeLeague, setActiveLeague, clubs, selectedId, onSelect, onNext, btmPad,
}: {
  leagues: readonly UsLeague[];
  activeLeague: UsLeague;
  setActiveLeague: (l: UsLeague) => void;
  clubs: Club[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  btmPad: number;
}) {
  return (
    <View style={s.flex}>
      {/* Logo */}
      <View style={s.logoArea}>
        <RewloLogo />
        <Text style={s.stepTitle}>Pick your team</Text>
        <Text style={s.stepSub}>Select the club you root for most</Text>
      </View>

      {/* League tabs */}
      <View style={s.tabsWrap}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabs}
        >
          {leagues.map((l) => (
            <Pressable
              key={l}
              onPress={() => { setActiveLeague(l); Haptics.selectionAsync(); }}
              style={[s.tab, activeLeague === l ? s.tabActive : s.tabInactive]}
            >
              <Text style={[s.tabText, { color: activeLeague === l ? WHITE : MUTED }]}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Club grid */}
      <FlatList
        key={activeLeague}
        data={clubs}
        keyExtractor={(c) => c.id}
        numColumns={3}
        style={s.flex}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sel = item.id === selectedId;
          const logoUrl = CLUB_LOGO_URLS[item.id];
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [s.clubItem, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={[
                s.clubCircle,
                sel
                  ? { borderColor: item.accentColor, borderWidth: 2.5, backgroundColor: `${item.badgeBackground}CC` }
                  : { borderColor: "rgba(255,255,255,0.12)", borderWidth: 1.5, backgroundColor: `${item.badgeBackground}66` },
              ]}>
                {logoUrl
                  ? <Image source={{ uri: logoUrl }} style={s.teamLogo} resizeMode="contain" />
                  : <ClubBadge club={item} size={46} />}
                {sel && (
                  <View style={[s.checkBadge, { backgroundColor: item.accentColor }]}>
                    <Ionicons name="checkmark" size={9} color="#000" />
                  </View>
                )}
              </View>
              <Text style={[s.clubName, { color: sel ? WHITE : "#94A3B8" }]} numberOfLines={1}>
                {item.shortName}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* CTA */}
      <View style={[s.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={onNext}
          disabled={!selectedId}
          style={({ pressed }) => [
            s.cta,
            { backgroundColor: selectedId ? PRIMARY : "rgba(255,255,255,0.1)", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[s.ctaText, { color: selectedId ? WHITE : MUTED }]}>Continue</Text>
          {selectedId && <Ionicons name="arrow-forward" size={18} color={WHITE} />}
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 2 — Do you follow other teams?
// ═══════════════════════════════════════════════════════════════
function Step2({
  followsOther, onToggle,
  leagues, activeLeague, setActiveLeague, clubs, selectedId, onSelect,
  onNext, btmPad,
}: {
  followsOther: boolean | null;
  onToggle: (v: boolean) => void;
  leagues: readonly UsLeague[];
  activeLeague: UsLeague;
  setActiveLeague: (l: UsLeague) => void;
  clubs: Club[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
  btmPad: number;
}) {
  const canContinue =
    followsOther === false || (followsOther === true && selectedId !== null);

  return (
    <View style={s.flex}>
      <View style={s.logoArea}>
        <RewloLogo />
        <Text style={s.stepTitle}>Other teams?</Text>
        <Text style={s.stepSub}>Do you follow other teams too?</Text>
      </View>

      {/* Yes / No toggle */}
      <View style={s.toggleRow}>
        {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
          <Pressable
            key={label}
            onPress={() => onToggle(val)}
            style={[
              s.toggleBtn,
              followsOther === val
                ? { backgroundColor: PRIMARY, borderColor: PRIMARY }
                : { backgroundColor: CARD_BG, borderColor: BORDER },
            ]}
          >
            {followsOther === val && (
              <Ionicons
                name={val ? "checkmark-circle" : "close-circle"}
                size={16}
                color={WHITE}
              />
            )}
            <Text style={[s.toggleText, { color: followsOther === val ? WHITE : MUTED }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* If YES: pick one more club */}
      {followsOther === true && (
        <View style={s.flex}>
          <Text style={s.pickOneLabel}>Pick one more club</Text>

          <View style={s.tabsWrap}>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabs}
            >
              {leagues.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => { setActiveLeague(l); Haptics.selectionAsync(); }}
                  style={[s.tab, activeLeague === l ? s.tabActive : s.tabInactive]}
                >
                  <Text style={[s.tabText, { color: activeLeague === l ? WHITE : MUTED }]}>{l}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <FlatList
            key={activeLeague}
            data={clubs}
            keyExtractor={(c) => c.id}
            numColumns={3}
            style={s.flex}
            contentContainerStyle={s.grid}
            columnWrapperStyle={s.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const sel = item.id === selectedId;
              const logoUrl = CLUB_LOGO_URLS[item.id];
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={({ pressed }) => [s.clubItem, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <View style={[
                    s.clubCircle,
                    sel
                      ? { borderColor: item.accentColor, borderWidth: 2.5, backgroundColor: `${item.badgeBackground}CC` }
                      : { borderColor: "rgba(255,255,255,0.12)", borderWidth: 1.5, backgroundColor: `${item.badgeBackground}66` },
                  ]}>
                    {logoUrl
                      ? <Image source={{ uri: logoUrl }} style={s.teamLogo} resizeMode="contain" />
                      : <ClubBadge club={item} size={46} />}
                    {sel && (
                      <View style={[s.checkBadge, { backgroundColor: item.accentColor }]}>
                        <Ionicons name="checkmark" size={9} color="#000" />
                      </View>
                    )}
                  </View>
                  <Text style={[s.clubName, { color: sel ? WHITE : "#94A3B8" }]} numberOfLines={1}>
                    {item.shortName}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* No-selection spacer */}
      {followsOther !== true && <View style={s.flex} />}

      {/* CTA */}
      <View style={[s.footer, { paddingBottom: btmPad + 12 }]}>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={({ pressed }) => [
            s.cta,
            { backgroundColor: canContinue ? PRIMARY : "rgba(255,255,255,0.1)", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[s.ctaText, { color: canContinue ? WHITE : MUTED }]}>Continue</Text>
          {canContinue && <Ionicons name="arrow-forward" size={18} color={WHITE} />}
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 3 — Account creation
// ═══════════════════════════════════════════════════════════════
function Step3({
  email, setEmail, password, setPassword, zip, setZip,
  showPassword, setShowPassword, errors, loading, onSubmit, btmPad,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  zip: string; setZip: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  errors: { email?: string; password?: string; zip?: string };
  loading: boolean;
  onSubmit: () => void;
  btmPad: number;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.flex}
    >
      <ScrollView
        contentContainerStyle={[s.step3Scroll, { paddingBottom: btmPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={[s.logoArea, { marginBottom: 24 }]}>
          <RewloLogo />
          <Text style={s.stepTitle}>Create your account</Text>
          <Text style={s.stepSub}>Almost there — just a few details</Text>
        </View>

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Email address</Text>
          <View style={[s.inputWrap, errors.email ? s.inputError : null]}>
            <Ionicons name="mail-outline" size={18} color={MUTED} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          {errors.email && <Text style={s.errText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Password</Text>
          <View style={[s.inputWrap, errors.password ? s.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Min. 6 characters"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
            </Pressable>
          </View>
          {errors.password && <Text style={s.errText}>{errors.password}</Text>}
        </View>

        {/* ZIP code */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>ZIP code</Text>
          <View style={[s.inputWrap, errors.zip ? s.inputError : null]}>
            <Ionicons name="location-outline" size={18} color={MUTED} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="e.g. 90210"
              placeholderTextColor={MUTED}
              value={zip}
              onChangeText={(v) => setZip(v.replace(/\D/g, "").slice(0, 5))}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              maxLength={5}
            />
          </View>
          {errors.zip && <Text style={s.errText}>{errors.zip}</Text>}
        </View>

        {/* Terms note */}
        <Text style={s.terms}>
          By creating an account you agree to Rewlo's{" "}
          <Text style={{ color: PRIMARY }}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={{ color: PRIMARY }}>Privacy Policy</Text>.
        </Text>

        {/* CTA */}
        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => [
            s.cta, { backgroundColor: PRIMARY, opacity: pressed || loading ? 0.85 : 1, marginTop: 8 },
          ]}
        >
          <Text style={[s.ctaText, { color: WHITE }]}>
            {loading ? "Creating account…" : "Create Account"}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={18} color={WHITE} />}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared styles
// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  gradient: { flex: 1 },
  root: { flex: 1 },
  flex: { flex: 1 },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoArea: { alignItems: "center", paddingHorizontal: 24, gap: 6, marginBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: "700" as const, color: WHITE, textAlign: "center" as const },
  stepSub: { fontSize: 14, color: MUTED, textAlign: "center" as const },
  tabsWrap: { height: 52, flexShrink: 0 },
  tabs: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  tabInactive: { backgroundColor: CARD_BG, borderColor: BORDER },
  tabText: { fontSize: 13, fontWeight: "600" as const },
  grid: { paddingHorizontal: 8, paddingBottom: 8 },
  gridRow: { gap: 4, marginBottom: 12 },
  clubItem: {
    flex: 1,
    alignItems: "center",
    gap: 7,
  },
  clubCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogo: { width: 56, height: 56 },
  clubName: { fontSize: 12, fontWeight: "600" as const, textAlign: "center" as const },
  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.07)" },
  cta: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 17, fontWeight: "700" as const },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  toggleText: { fontSize: 17, fontWeight: "700" as const },
  pickOneLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: WHITE,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  step3Scroll: { paddingHorizontal: 24, paddingTop: 8 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 14, fontWeight: "600" as const, color: "#94A3B8", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputError: { borderColor: "#EF4444" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: WHITE, fontSize: 16 },
  eyeBtn: { padding: 6 },
  errText: { color: "#EF4444", fontSize: 12, marginTop: 5 },
  terms: { fontSize: 12, color: MUTED, textAlign: "center" as const, lineHeight: 18, marginBottom: 20 },
});
