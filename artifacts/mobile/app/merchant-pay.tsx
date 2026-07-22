import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useWallet } from "@/context/WalletContext";
import { walletRequest } from "@/utils/walletApi";
type Merchant = { id: number; code: string; name: string; description: string };
export default function MerchantPay() {
  const c = useColors(),
    i = useSafeAreaInsets(),
    { balance, refreshWallet } = useWallet();
  const [code, setCode] = useState(""),
    [merchant, setMerchant] = useState<Merchant | null>(null),
    [amount, setAmount] = useState(""),
    [confirm, setConfirm] = useState(false),
    [loading, setLoading] = useState(false),
    [reference, setReference] = useState(""),
    [error, setError] = useState("");
  const dollars = Number(amount),
    valid = dollars > 0 && dollars <= balance;
  async function lookup() {
    setError("");
    try {
      setMerchant(
        await walletRequest(
          `/api/merchants/${encodeURIComponent(code.trim().toUpperCase())}`,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merchant not found");
    }
  }
  async function pay() {
    if (!merchant || !valid) return;
    setLoading(true);
    try {
      const r = await walletRequest<{ reference: string }>(
        "/api/wallet/merchant-pay",
        {
          method: "POST",
          body: JSON.stringify({
            merchantCode: merchant.code,
            amount: dollars.toFixed(2),
          }),
        },
      );
      await refreshWallet();
      setReference(r.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <View
      style={[s.root, { backgroundColor: c.background, paddingTop: i.top }]}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={25} color={c.foreground} />
        </Pressable>
        <Text style={[s.title, { color: c.foreground }]}>RewLo Pay</Text>
        <Pressable onPress={() => router.push("/scan")}>
          <Ionicons name="qr-code-outline" size={24} color={c.primary} />
        </Pressable>
      </View>
      <View style={s.content}>
        {reference ? (
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
            <Text selectable style={[s.ref, { color: c.mutedForeground }]}>
              Reference {reference}
            </Text>
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
                  placeholder="e.g. MANC001"
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
                    editable={!confirm}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={c.mutedForeground}
                    style={[s.amount, { color: c.foreground }]}
                  />
                </View>
                <Text style={[s.sub, { color: c.mutedForeground }]}>
                  Available ${balance.toFixed(2)}
                </Text>
                <Button
                  disabled={!valid || loading}
                  label={
                    loading
                      ? "Paying…"
                      : confirm
                        ? `Confirm $${dollars.toFixed(2)}`
                        : "Review Payment"
                  }
                  onPress={() => (confirm ? pay() : setConfirm(true))}
                />
              </>
            )}
            {!!error && <Text style={s.error}>{error}</Text>}
          </>
        )}
      </View>
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
  total: { fontSize: 48, fontFamily: "Inter_700Bold" },
  ref: { marginTop: 20, fontSize: 12, textAlign: "center" },
  error: { color: "#EF4444", textAlign: "center", marginTop: 16 },
});
