import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiErrorDialog } from "@/components/ApiErrorDialog";
import { useColors } from "@/hooks/useColors";
import { useWallet } from "@/context/WalletContext";
import { apiErrorMessage, walletRequest } from "@/utils/walletApi";
type Merchant = { id: number; code: string; name: string; description: string };
type PayPlan = {
  merchant: string;
  amountCents: number;
  pointsToApply: number;
  pointsValueCents: number;
  cashCents: number;
  cardCents: number;
  pointsBalance: number;
  cashBalanceCents: number;
  rationale: string;
};
export default function MerchantPay() {
  const c = useColors(),
    i = useSafeAreaInsets(),
    { balance, refreshWallet } = useWallet();
  const [code, setCode] = useState(""),
    [merchant, setMerchant] = useState<Merchant | null>(null),
    [amount, setAmount] = useState(""),
    [plan, setPlan] = useState<PayPlan | null>(null),
    [planLoading, setPlanLoading] = useState(false),
    [loading, setLoading] = useState(false),
    [paid, setPaid] = useState(false),
    [paidPoints, setPaidPoints] = useState(0),
    [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  const dollars = Number(amount),
    valid = dollars > 0;
  async function lookup() {
    setError("");
    try {
      setMerchant(
        await walletRequest(
          `/api/merchants/${encodeURIComponent(code.trim().toUpperCase())}`,
        ),
      );
    } catch (e) {
      setError(apiErrorMessage(e, "Merchant not found"));
    }
  }
  async function requestPlan() {
    if (!merchant || !valid) return;
    setPlanLoading(true);
    try {
      setPlan(
        await walletRequest<PayPlan>("/api/wallet/pay-plan", {
          method: "POST",
          body: JSON.stringify({
            merchantCode: merchant.code,
            amount: dollars.toFixed(2),
          }),
        }),
      );
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't build a payment plan"));
    } finally {
      setPlanLoading(false);
    }
  }
  async function startCardCheckout(pointsToApply: number) {
    if (!merchant || !valid) return;
    setLoading(true);
    try {
      const session = await walletRequest<{ sessionId: string; url: string }>(
        "/api/wallet/stripe-checkout-session",
        {
          method: "POST",
          body: JSON.stringify({
            merchantCode: merchant.code,
            amount: dollars.toFixed(2),
            ...(pointsToApply > 0 ? { pointsToApply } : {}),
          }),
        },
      );
      setCheckoutSessionId(session.sessionId);
      setPaidPoints(pointsToApply);
      await Linking.openURL(session.url);
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't start card payment"));
    } finally {
      setLoading(false);
    }
  }
  async function finishCardCheckout() {
    if (!checkoutSessionId) return;
    setLoading(true);
    try {
      await walletRequest("/api/wallet/stripe-checkout-complete", {
        method: "POST",
        body: JSON.stringify({ sessionId: checkoutSessionId }),
      });
      await refreshWallet();
      setPaid(true);
    } catch (e) {
      setError(apiErrorMessage(e, "Card payment isn't complete yet — finish it in your browser, then try again"));
    } finally {
      setLoading(false);
    }
  }
  async function pay(pointsToApply: number) {
    if (!merchant || !valid) return;
    setLoading(true);
    try {
      await walletRequest<{ reference: string }>(
        "/api/wallet/merchant-pay",
        {
          method: "POST",
          body: JSON.stringify({
            merchantCode: merchant.code,
            amount: dollars.toFixed(2),
            ...(pointsToApply > 0 ? { pointsToApply } : {}),
          }),
        },
      );
      await refreshWallet();
      setPaidPoints(pointsToApply);
      setPaid(true);
    } catch (e) {
      setError(apiErrorMessage(e, "Payment failed"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <View
      style={[s.root, { backgroundColor: c.background, paddingTop: i.top }]}
    >
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close RewLo Pay"
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Ionicons name="close" size={25} color={c.foreground} />
        </Pressable>
        <Text style={[s.title, { color: c.foreground }]}>RewLo Pay</Text>
        <Pressable onPress={() => router.push("/scan")}>
          <Ionicons name="qr-code-outline" size={24} color={c.primary} />
        </Pressable>
      </View>
      <View style={s.content}>
        {paid ? (
          <View style={s.center}>
            <Ionicons name="checkmark-circle" size={94} color={c.success} />
            <Text style={[s.heading, { color: c.foreground }]}>
              Payment complete
            </Text>
            <Text style={[s.total, { color: c.foreground }]}>
              ${dollars.toFixed(2)}
            </Text>
            <Text style={{ color: c.mutedForeground }}>
              Paid to {merchant?.name}
            </Text>
            {paidPoints > 0 && (
              <Text style={{ color: c.mutedForeground, marginTop: 4 }}>
                {paidPoints.toLocaleString()} points applied
              </Text>
            )}
            <Button label="Done" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            {!merchant ? (
              <>
                <Text style={[s.heading, { color: c.foreground }]}>
                  Pay a merchant
                </Text>
                <Text style={[s.sub, { color: c.mutedForeground }]}>
                  Scan a QR code or enter the merchant code
                </Text>
                <Pressable
                  onPress={() => router.push("/scan")}
                  style={[
                    s.scan,
                    { borderColor: c.border, backgroundColor: c.card },
                  ]}
                >
                  <Ionicons name="scan" size={25} color={c.primary} />
                  <Text style={[s.scanText, { color: c.foreground }]}>
                    Scan merchant QR
                  </Text>
                </Pressable>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  placeholder="e.g. MAN001"
                  placeholderTextColor={c.mutedForeground}
                  style={[
                    s.input,
                    {
                      color: c.foreground,
                      backgroundColor: c.card,
                      borderColor: c.border,
                    },
                  ]}
                />
                <Button
                  disabled={!code.trim()}
                  label="Find Merchant"
                  onPress={lookup}
                />
              </>
            ) : (
              <>
                <View
                  style={[
                    s.merchant,
                    { backgroundColor: c.card, borderColor: c.border },
                  ]}
                >
                  <Ionicons name="storefront" size={34} color={c.primary} />
                  <View>
                    <Text style={[s.merchantName, { color: c.foreground }]}>
                      {merchant.name}
                    </Text>
                    <Text style={{ color: c.mutedForeground }}>
                      {merchant.code}
                    </Text>
                  </View>
                </View>
                <View style={s.amountRow}>
                  <Text style={[s.currency, { color: c.foreground }]}>$</Text>
                  <TextInput
                    editable={!plan}
                    value={amount}
                    onChangeText={(t) => { setAmount(t); setPlan(null); setCheckoutSessionId(null); }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={c.mutedForeground}
                    style={[s.amount, { color: c.foreground }]}
                  />
                </View>
                <Text style={[s.sub, { color: c.mutedForeground }]}>
                  Available ${balance.toFixed(2)}
                </Text>
                {!plan ? (
                  <Button
                    disabled={!valid || planLoading}
                    label={planLoading ? "Finding best combination…" : "Review Payment"}
                    onPress={requestPlan}
                  />
                ) : (
                  <>
                    <View style={[s.planCard, { backgroundColor: c.card, borderColor: c.border }]}>
                      <View style={s.planHeader}>
                        <Ionicons name="sparkles" size={16} color={c.primary} />
                        <Text style={[s.planTitle, { color: c.foreground }]}>Smart split</Text>
                      </View>
                      <View style={s.planRow}>
                        <Text style={{ color: c.mutedForeground }}>Loyalty points</Text>
                        <Text style={[s.planValue, { color: c.foreground }]}>
                          {plan.pointsToApply.toLocaleString()} pts (−${(plan.pointsValueCents / 100).toFixed(2)})
                        </Text>
                      </View>
                      <View style={s.planRow}>
                        <Text style={{ color: c.mutedForeground }}>Wallet cash</Text>
                        <Text style={[s.planValue, { color: c.foreground }]}>
                          ${(plan.cashCents / 100).toFixed(2)}
                        </Text>
                      </View>
                      {plan.cardCents > 0 && (
                        <View style={s.planRow}>
                          <Text style={{ color: c.mutedForeground }}>Card (via Stripe)</Text>
                          <Text style={[s.planValue, { color: c.foreground }]}>
                            ${(plan.cardCents / 100).toFixed(2)}
                          </Text>
                        </View>
                      )}
                      <View style={[s.planRow, s.planTotalRow, { borderTopColor: c.border }]}>
                        <Text style={[s.planValue, { color: c.foreground }]}>Total</Text>
                        <Text style={[s.planValue, { color: c.foreground }]}>
                          ${(plan.amountCents / 100).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={[s.planRationale, { color: c.mutedForeground }]}>
                        {plan.rationale}
                      </Text>
                    </View>
                    {checkoutSessionId ? (
                      <Button
                        disabled={loading}
                        label={loading ? "Checking…" : "I've paid — finish payment"}
                        onPress={finishCardCheckout}
                      />
                    ) : (
                      <Button
                        disabled={loading}
                        label={
                          loading
                            ? "Paying…"
                            : plan.cardCents > 0
                              ? `Approve & Pay $${(plan.amountCents / 100).toFixed(2)} (card for $${(plan.cardCents / 100).toFixed(2)})`
                              : `Approve & Pay $${(plan.amountCents / 100).toFixed(2)}`
                        }
                        onPress={() =>
                          plan.cardCents > 0
                            ? startCardCheckout(plan.pointsToApply)
                            : pay(plan.pointsToApply)
                        }
                      />
                    )}
                    {plan.pointsToApply > 0 && (
                      <Pressable
                        disabled={loading || plan.amountCents / 100 > balance}
                        onPress={() => pay(0)}
                        style={{ opacity: loading || plan.amountCents / 100 > balance ? 0.4 : 1, marginTop: 14, alignSelf: "center" }}
                      >
                        <Text style={{ color: c.primary, fontFamily: "Inter_600SemiBold" }}>
                          Pay with cash only — keep my points
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </View>
      <ApiErrorDialog message={error} onClose={() => setError(null)} title="Payment failed" />
    </View>
  );
}
function Button({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled ? 0.45 : 1, marginTop: 20, width: "100%" }}
    >
      <LinearGradient colors={["#00E5CC", "#2563EB"]} style={s.button}>
        <Text style={s.buttonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 22 },
  heading: { fontSize: 25, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sub: { fontSize: 14, textAlign: "center", marginBottom: 22 },
  scan: {
    height: 64,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  scanText: { fontFamily: "Inter_600SemiBold" },
  input: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontFamily: "Inter_700Bold" },
  merchant: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  merchantName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  currency: { fontSize: 38 },
  amount: { fontSize: 58, fontFamily: "Inter_700Bold", minWidth: 160 },
  center: { alignItems: "center", paddingTop: 50 },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 24, gap: 10 },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  planTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  planRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  planValue: { fontFamily: "Inter_600SemiBold" },
  planRationale: { fontSize: 12, lineHeight: 17 },
  total: { fontSize: 48, fontFamily: "Inter_700Bold" },
});
