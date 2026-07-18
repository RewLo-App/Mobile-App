import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";
import {
  AgentRecommendation,
  AgentStep,
  DEMO_PURCHASES,
  MerchantCategory,
  runAgentAnalysis,
} from "@/utils/agentCommerce";

type Phase = "select" | "thinking" | "result" | "done";

interface SelectedPurchase {
  merchantName: string;
  merchantCategory: MerchantCategory;
  amount: number;
  emoji: string;
}

function StepRow({
  step,
  state,
  colors,
}: {
  step: AgentStep;
  state: "pending" | "active" | "done";
  colors: ReturnType<typeof useColors>;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "pending") {
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state, fade]);

  useEffect(() => {
    if (state === "active") {
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [state, spin]);

  if (state === "pending") return null;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.stepRow, { opacity: fade }]}>
      <View style={styles.stepIconCol}>
        {state === "active" ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="sync" size={18} color="#00E5CC" />
          </Animated.View>
        ) : (
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        )}
      </View>
      <View style={styles.stepTextCol}>
        <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
        <Text style={[styles.stepDetail, { color: colors.mutedForeground }]}>{step.detail}</Text>
      </View>
    </Animated.View>
  );
}

export default function SmartPayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rewloPoints, balance, spendPoints, addTransaction } = useWallet();

  const [phase, setPhase] = useState<Phase>("select");
  const [selected, setSelected] = useState<SelectedPurchase | null>(null);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const orbPulse = useRef(new Animated.Value(1)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clearTimer();
    };
  }, [clearTimer]);

  useEffect(() => {
    if (phase === "thinking") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(orbPulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(orbPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [phase, orbPulse]);

  const startAnalysis = useCallback(
    (purchase: SelectedPurchase) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const rec = runAgentAnalysis({
        amount: purchase.amount,
        merchantName: purchase.merchantName,
        merchantCategory: purchase.merchantCategory,
        pointBalance: rewloPoints,
      });

      // Cancel any in-flight run and start a fresh one.
      clearTimer();
      runIdRef.current += 1;
      const myRun = runIdRef.current;

      resultFade.setValue(0);
      setSelected(purchase);
      setRecommendation(rec);
      setVisibleSteps(0);
      setPhase("thinking");

      let idx = 0;
      const runStep = () => {
        if (myRun !== runIdRef.current) return;
        if (idx >= rec.steps.length) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase("result");
          Animated.timing(resultFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
          return;
        }
        setVisibleSteps(idx + 1);
        Haptics.selectionAsync();
        const dur = rec.steps[idx].durationMs;
        idx += 1;
        timerRef.current = setTimeout(runStep, dur);
      };
      timerRef.current = setTimeout(runStep, 400);
    },
    [rewloPoints, resultFade, clearTimer]
  );

  const confirmPayment = useCallback(() => {
    if (!recommendation || !selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (recommendation.action === "apply" && recommendation.pointsToApply > 0) {
      spendPoints(recommendation.pointsToApply);
    }
    addTransaction({
      type: "payment",
      amount: -recommendation.effectivePrice,
      description: recommendation.action === "apply"
        ? `RewLo Pay · ${recommendation.pointsToApply.toLocaleString()} pts applied`
        : `RewLo Pay · points saved`,
      merchant: selected.merchantName,
      status: "completed",
    });
    setPhase("done");
  }, [recommendation, selected, spendPoints, addTransaction]);

  const topPad = Platform.OS === "web" ? 24 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#062B47", "#041120", colors.background] as [string, string, string]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <MaterialCommunityIcons name="robot-happy-outline" size={18} color="#00E5CC" />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>RewLo Pay</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          AI agent finds the best moment to spend your points
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        {/* SELECT PHASE */}
        {phase === "select" && (
          <View>
            <View style={[styles.infoBanner, { backgroundColor: "rgba(0,229,204,0.08)", borderColor: "rgba(0,229,204,0.25)" }]}>
              <Ionicons name="sparkles" size={16} color="#00E5CC" />
              <Text style={[styles.infoBannerText, { color: colors.foreground }]}>
                Pick a purchase. The agent evaluates point value, active bonuses, and merchant category — then pays via the Stripe Agentic Commerce Protocol.
              </Text>
            </View>

            <View style={styles.balanceStrip}>
              <View style={[styles.balancePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={[styles.balancePillText, { color: colors.foreground }]}>
                  {rewloPoints.toLocaleString()} pts
                </Text>
              </View>
              <View style={[styles.balancePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                <Text style={[styles.balancePillText, { color: colors.foreground }]}>
                  ${balance.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a purchase</Text>
            {DEMO_PURCHASES.map((p) => (
              <Pressable
                key={p.merchantName}
                onPress={() =>
                  startAnalysis({
                    merchantName: p.merchantName,
                    merchantCategory: p.merchantCategory,
                    amount: p.amount,
                    emoji: p.emoji,
                  })
                }
                style={({ pressed }) => [
                  styles.purchaseCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.purchaseEmoji, { backgroundColor: colors.secondary }]}>
                  <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                </View>
                <View style={styles.purchaseInfo}>
                  <Text style={[styles.purchaseName, { color: colors.foreground }]}>{p.merchantName}</Text>
                  <View style={styles.purchaseMetaRow}>
                    <View style={[styles.catPill, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.catPillText, { color: colors.mutedForeground }]}>{p.merchantCategory}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.purchaseRight}>
                  <Text style={[styles.purchaseAmount, { color: colors.foreground }]}>${p.amount.toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* THINKING PHASE */}
        {phase === "thinking" && selected && recommendation && (
          <View style={styles.thinkingWrap}>
            <Animated.View style={[styles.orb, { transform: [{ scale: orbPulse }] }]}>
              <LinearGradient
                colors={["#00E5CC", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orbInner}
              >
                <MaterialCommunityIcons name="robot-happy-outline" size={36} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.thinkingTitle, { color: colors.foreground }]}>Agent is analysing…</Text>
            <Text style={[styles.thinkingSub, { color: colors.mutedForeground }]}>
              {selected.emoji} {selected.merchantName} · ${selected.amount.toFixed(2)}
            </Text>

            <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {recommendation.steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  state={i < visibleSteps - 1 ? "done" : i === visibleSteps - 1 ? "active" : "pending"}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && selected && recommendation && (
          <Animated.View style={{ opacity: resultFade }}>
            <View style={styles.resultBadgeWrap}>
              <View style={[styles.resultBadge, { backgroundColor: recommendation.action === "apply" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)" }]}>
                <Ionicons
                  name={recommendation.action === "apply" ? "checkmark-circle" : "shield-checkmark"}
                  size={16}
                  color={recommendation.action === "apply" ? colors.success : colors.gold}
                />
                <Text style={[styles.resultBadgeText, { color: recommendation.action === "apply" ? colors.success : colors.gold }]}>
                  {recommendation.action === "apply" ? "Agent recommends applying points" : "Agent recommends saving points"}
                </Text>
              </View>
            </View>

            {/* Recommendation card */}
            <LinearGradient
              colors={["#0B2040", "#062B47"]}
              style={[styles.recCard, { borderColor: "rgba(0,229,204,0.25)" }]}
            >
              <Text style={[styles.recMerchant, { color: colors.mutedForeground }]}>
                {selected.emoji} {selected.merchantName}
              </Text>

              <View style={styles.recPriceRow}>
                <View>
                  <Text style={[styles.recPriceLabel, { color: colors.mutedForeground }]}>You pay</Text>
                  <Text style={[styles.recPrice, { color: colors.foreground }]}>
                    ${recommendation.effectivePrice.toFixed(2)}
                  </Text>
                </View>
                {recommendation.action === "apply" && (
                  <View style={styles.recOldPriceWrap}>
                    <Text style={[styles.recOldPrice, { color: colors.mutedForeground }]}>
                      ${selected.amount.toFixed(2)}
                    </Text>
                    <View style={[styles.savePill, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                      <Text style={[styles.savePillText, { color: colors.success }]}>
                        Save ${recommendation.savingsAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {recommendation.action === "apply" && (
                <View style={[styles.recPointsRow, { borderTopColor: colors.border }]}>
                  <Ionicons name="star" size={15} color={colors.gold} />
                  <Text style={[styles.recPointsText, { color: colors.foreground }]}>
                    {recommendation.pointsToApply.toLocaleString()} points applied
                  </Text>
                  {recommendation.bonusActive && recommendation.bonusLabel && (
                    <View style={[styles.bonusPill, { backgroundColor: "rgba(0,229,204,0.15)" }]}>
                      <Text style={styles.bonusPillText}>{recommendation.bonusLabel}</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>

            {/* Reasoning */}
            <View style={[styles.reasoningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reasoningHeader}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#00E5CC" />
                <Text style={[styles.reasoningTitle, { color: colors.foreground }]}>Agent reasoning</Text>
              </View>
              <Text style={[styles.reasoningText, { color: colors.mutedForeground }]}>
                {recommendation.reasoning}
              </Text>
            </View>

            {/* Stripe protocol strip */}
            <View style={[styles.stripeStrip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="shield-lock-outline" size={14} color={colors.primary} />
              <Text style={[styles.stripeStripText, { color: colors.mutedForeground }]} numberOfLines={1}>
                Stripe Agentic Commerce · {recommendation.stripePaymentIntentId}
              </Text>
            </View>

            {/* Actions */}
            <Pressable onPress={confirmPayment} style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient
                colors={["#00E5CC", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGrad}
              >
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  Confirm & Pay ${recommendation.effectivePrice.toFixed(2)}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => { clearTimer(); runIdRef.current += 1; Haptics.selectionAsync(); setPhase("select"); setSelected(null); setRecommendation(null); }}
              style={styles.secondaryBtn}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Choose a different purchase</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* DONE PHASE */}
        {phase === "done" && selected && recommendation && (
          <View style={styles.doneWrap}>
            <View style={[styles.doneCircle, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Payment complete</Text>
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Paid ${recommendation.effectivePrice.toFixed(2)} to {selected.merchantName}
            </Text>
            {recommendation.action === "apply" && (
              <View style={[styles.doneSavePill, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                <Ionicons name="star" size={14} color={colors.success} />
                <Text style={[styles.doneSaveText, { color: colors.success }]}>
                  Saved ${recommendation.savingsAmount.toFixed(2)} with {recommendation.pointsToApply.toLocaleString()} points
                </Text>
              </View>
            )}

            <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Payment Intent</Text>
                <Text style={[styles.receiptValue, { color: colors.foreground }]} numberOfLines={1}>
                  {recommendation.stripePaymentIntentId}
                </Text>
              </View>
              <View style={[styles.receiptRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Protocol</Text>
                <Text style={[styles.receiptValue, { color: colors.foreground }]}>Stripe Agentic Commerce</Text>
              </View>
              <View style={[styles.receiptRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Status</Text>
                <Text style={[styles.receiptValue, { color: colors.success }]}>Succeeded</Text>
              </View>
            </View>

            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient
                colors={["#00E5CC", "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGrad}
              >
                <Text style={styles.primaryBtnText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },

  infoBanner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 18 },
  infoBannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },

  balanceStrip: { flexDirection: "row", gap: 10, marginBottom: 22 },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  balancePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  purchaseCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12, gap: 14 },
  purchaseEmoji: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  purchaseInfo: { flex: 1, gap: 6 },
  purchaseName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  purchaseMetaRow: { flexDirection: "row", gap: 6 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  purchaseRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  purchaseAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },

  thinkingWrap: { alignItems: "center", paddingTop: 20 },
  orb: { marginBottom: 22 },
  orbInner: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  thinkingTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  thinkingSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 26 },
  stepsCard: { width: "100%", borderRadius: 18, borderWidth: 1, padding: 6 },
  stepRow: { flexDirection: "row", padding: 12, gap: 12, alignItems: "flex-start" },
  stepIconCol: { width: 20, alignItems: "center", paddingTop: 1 },
  stepTextCol: { flex: 1, gap: 3 },
  stepLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stepDetail: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },

  resultBadgeWrap: { alignItems: "center", marginBottom: 16 },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  resultBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  recCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14 },
  recMerchant: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 14 },
  recPriceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  recPriceLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  recPrice: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  recOldPriceWrap: { alignItems: "flex-end", gap: 6 },
  recOldPrice: { fontSize: 15, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  savePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  savePillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  recPointsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexWrap: "wrap" },
  recPointsText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bonusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  bonusPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#00E5CC" },

  reasoningCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  reasoningHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  reasoningTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reasoningText: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },

  stripeStrip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  stripeStripText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },

  primaryBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 10 },
  primaryBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: { alignItems: "center", paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  doneWrap: { alignItems: "center", paddingTop: 20 },
  doneCircle: { width: 108, height: 108, borderRadius: 54, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  doneTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 6 },
  doneSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 14 },
  doneSavePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 24 },
  doneSaveText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  receiptCard: { width: "100%", borderRadius: 16, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  receiptLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  receiptValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", flexShrink: 1, textAlign: "right" },
});
