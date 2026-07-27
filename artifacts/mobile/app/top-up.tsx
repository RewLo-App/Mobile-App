import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiErrorDialog } from "@/components/ApiErrorDialog";
import { useColors } from "@/hooks/useColors";
import { useWallet } from "@/context/WalletContext";
import { apiErrorMessage, walletRequest } from "@/utils/walletApi";
type Card = {
  id: number;
  last4Digits: string;
  expiry: string;
  provider: string;
  isDefault: boolean;
};
export default function TopUp() {
  const c = useColors(),
    i = useSafeAreaInsets(),
    { refreshWallet } = useWallet();
  const [cards, setCards] = useState<Card[]>([]),
    [selected, setSelected] = useState<number | null>(null),
    [amount, setAmount] = useState(""),
    [confirm, setConfirm] = useState(false),
    [loading, setLoading] = useState(false),
    [done, setDone] = useState(""),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    walletRequest<{ cards: Card[] }>("/api/wallet/cards")
      .then(async (x) => {
        const availableCards = x.cards.length > 0
          ? x.cards
          : [(await walletRequest<{ card: Card }>("/api/wallet/cards/provision", { method: "POST" })).card];
        setCards(availableCards);
        setSelected(
          availableCards.find((card) => card.isDefault)?.id ?? availableCards[0]?.id ?? null,
        );
      })
      .catch((e) => setError(apiErrorMessage(e, "Could not load your payment cards")));
  }, []);
  const QUICK_AMOUNTS = [10, 25, 50, 100];
  const value = Number(amount),
    valid = value > 0 && Number.isFinite(value),
    canSubmit = valid && selected !== null;
  async function submit() {
    if (!selected || !valid) return;
    setLoading(true);
    setError("");
    try {
      const r = await walletRequest<{ reference: string }>(
        "/api/wallet/top-up",
        {
          method: "POST",
          body: JSON.stringify({ cardId: selected, amount: value.toFixed(2) }),
        },
      );
      await refreshWallet();
      setDone(r.reference);
    } catch (e) {
      setError(apiErrorMessage(e, "Top up failed"));
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
          <Ionicons name="arrow-back" size={24} color={c.foreground} />
        </Pressable>
        <Text style={[s.title, { color: c.foreground }]}>Top Up</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {done ? (
          <View style={s.success}>
            <Ionicons name="checkmark-circle" size={90} color={c.success} />
            <Text style={[s.heading, { color: c.foreground }]}>
              Wallet topped up
            </Text>
            <Text style={[s.amountText, { color: c.foreground }]}>
              {value.toFixed(2)} RWLO
            </Text>
            <Text style={[s.note, { color: c.mutedForeground }]}>
              ${value.toFixed(2)} added · 1 USD = 1 RWLO
            </Text>
            <Button label="Done" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Text style={[s.heading, { color: c.foreground }]}>
              {confirm ? "Confirm top up" : "Choose debit card"}
            </Text>
            {cards.map((card) => (
              <Pressable
                key={card.id}
                disabled={confirm}
                onPress={() => setSelected(card.id)}
                style={[
                  s.card,
                  {
                    backgroundColor: c.card,
                    borderColor: selected === card.id ? c.primary : c.border,
                  },
                ]}
              >
                <Ionicons name="card" size={25} color={c.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardName, { color: c.foreground }]}>
                    {card.provider} •••• {card.last4Digits}
                  </Text>
                  <Text style={{ color: c.mutedForeground }}>
                    Expires {card.expiry}
                  </Text>
                </View>
                {card.isDefault && (
                  <Text style={{ color: c.success }}>Default</Text>
                )}
                {selected === card.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={c.primary}
                  />
                )}
              </Pressable>
            ))}
            <View style={s.amountRow}>
              <Text style={[s.currency, { color: c.foreground }]}>$</Text>
              <TextInput
                editable={!confirm}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={c.mutedForeground}
                style={[
                  s.amount,
                  {
                    color: c.foreground,
                    width: Math.max((amount || "0.00").length, 4) * 34,
                  },
                ]}
              />
            </View>
            <View style={s.quickRow}>
              {QUICK_AMOUNTS.map((q) => {
                const active = amount === String(q);
                return (
                  <Pressable
                    key={q}
                    disabled={confirm}
                    onPress={() => setAmount(String(q))}
                    style={[
                      s.quickBtn,
                      {
                        backgroundColor: active ? c.primary : c.card,
                        borderColor: active ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.quickText,
                        { color: active ? "#041120" : c.foreground },
                      ]}
                    >
                      ${q}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[s.conversion, { color: c.primary }]}>
              {valid ? `You'll receive ${value.toFixed(2)} RWLO` : "1 USD = 1 RWLO"}
            </Text>
            <Text style={[s.note, { color: c.mutedForeground }]}>
              1 USD = 1 RWLO · Use your Rewlo Premium card to add funds securely.
            </Text>
            <Button
              disabled={!canSubmit || loading}
              label={
                loading
                  ? "Processing…"
                  : confirm
                    ? `Confirm $${value.toFixed(2)}`
                    : "Continue"
              }
              onPress={() => (confirm ? submit() : setConfirm(true))}
            />
            {confirm && (
              <Pressable onPress={() => setConfirm(false)}>
                <Text style={[s.cancel, { color: c.mutedForeground }]}>
                  Change details
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
      <ApiErrorDialog message={error} onClose={() => setError(null)} title="Top up failed" />
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
      style={{ opacity: disabled ? 0.5 : 1, marginTop: 24, width: "100%" }}
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
  content: { padding: 20 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 18 },
  card: {
    minHeight: 72,
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,
  },
  currency: { fontSize: 38, marginRight: 6 },
  amount: { fontSize: 56, fontFamily: "Inter_700Bold", textAlign: "left" },
  amountText: { fontSize: 48, fontFamily: "Inter_700Bold" },
  note: { textAlign: "center", fontSize: 13 },
  conversion: {
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 6,
    marginBottom: 8,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  quickBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancel: { textAlign: "center", padding: 16 },
  success: { alignItems: "center", gap: 10, paddingTop: 40, width: "100%" },
});
