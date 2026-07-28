import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiErrorDialog } from "@/components/ApiErrorDialog";
import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";
import {
  assistantApi,
  type AssistantRule,
  type DraftedAction,
} from "@/utils/assistantApi";
import { apiErrorMessage } from "@/utils/walletApi";

const EXAMPLES = [
  "Always grab stadium food deals under 500 points",
  "Redeem any jersey discount from my club shop",
  "Get me every gaming offer with a RewLo bonus",
];

export default function AssistantRulesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshWallet } = useWallet();
  const [rules, setRules] = useState<AssistantRule[]>([]);
  const [drafts, setDrafts] = useState<DraftedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleText, setRuleText] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ruleData, draftData] = await Promise.all([
        assistantApi.rules(),
        assistantApi.draftedActions(),
      ]);
      setRules(ruleData.rules);
      setDrafts(draftData.draftedActions);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not load your assistant rules."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createRule = async () => {
    const text = ruleText.trim();
    if (!text || creating) return;
    setCreating(true);
    try {
      await assistantApi.createRule(text);
      setRuleText("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save that rule."));
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = async (rule: AssistantRule) => {
    try {
      await assistantApi.updateRule(rule.id, !rule.active);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !rule.active } : r)));
    } catch (e) {
      setError(apiErrorMessage(e, "Could not update the rule."));
    }
  };

  const deleteRule = (rule: AssistantRule) => {
    Alert.alert("Delete rule?", `"${rule.ruleText}"`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          assistantApi
            .deleteRule(rule.id)
            .then(() => setRules((prev) => prev.filter((r) => r.id !== rule.id)))
            .catch((e) => setError(apiErrorMessage(e, "Could not delete the rule.")));
        },
      },
    ]);
  };

  const confirmDraft = async (draft: DraftedAction) => {
    if (confirmingId) return;
    setConfirmingId(draft.id);
    try {
      await assistantApi.confirmDraftedAction(draft.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      void refreshWallet().catch(() => undefined);
      Alert.alert("Redeemed", `${draft.offer.title} at ${draft.offer.merchant} is yours.`);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not complete the redemption."));
      void load();
    } finally {
      setConfirmingId(null);
    }
  };

  const dismissDraft = async (draft: DraftedAction) => {
    try {
      await assistantApi.dismissDraftedAction(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (e) {
      setError(apiErrorMessage(e, "Could not dismiss the suggestion."));
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Assistant Rules</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Consent banner */}
        <View style={[styles.consentCard, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}44` }]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={[styles.consentText, { color: colors.foreground }]}>
            Your assistant only drafts redemptions. Nothing is ever paid without your one-tap confirmation.
          </Text>
        </View>

        {/* Drafted actions awaiting consent */}
        {drafts.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ready for your approval</Text>
            {drafts.map((draft) => (
              <View key={draft.id} style={[styles.draftCard, { backgroundColor: colors.card, borderColor: `${colors.primary}55` }]}>
                <View style={styles.draftTop}>
                  <View style={[styles.draftIcon, { backgroundColor: `${colors.primary}22` }]}>
                    <Ionicons name="flash" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.draftTitle, { color: colors.foreground }]}>
                      {draft.offer.title}
                    </Text>
                    <Text style={[styles.draftMeta, { color: colors.mutedForeground }]}>
                      {draft.offer.merchant} · {draft.offer.pointsCost.toLocaleString()} pts · exp {draft.offer.expiresAt}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.draftWhy, { color: colors.mutedForeground }]}>
                  Matches your rule: “{draft.ruleText}”
                </Text>
                <View style={styles.draftActions}>
                  <Pressable
                    onPress={() => void dismissDraft(draft)}
                    style={[styles.draftBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.draftBtnText, { color: colors.mutedForeground }]}>Not this one</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void confirmDraft(draft)}
                    disabled={confirmingId !== null}
                    style={[styles.draftBtn, { backgroundColor: colors.primary, opacity: confirmingId === draft.id ? 0.6 : 1 }]}
                  >
                    {confirmingId === draft.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.draftBtnText, { color: "#fff" }]}>Confirm & redeem</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Create rule */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add a standing rule</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Tell the assistant what to watch for, in your own words.
          </Text>
          <TextInput
            value={ruleText}
            onChangeText={setRuleText}
            placeholder='e.g. "Always grab away tickets under 700 points"'
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
          <Pressable
            onPress={() => void createRule()}
            disabled={creating || !ruleText.trim()}
            style={[styles.createBtn, { backgroundColor: ruleText.trim() && !creating ? colors.primary : colors.border }]}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Save rule</Text>
            )}
          </Pressable>
          <View style={styles.exampleWrap}>
            {EXAMPLES.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => setRuleText(ex)}
                style={[styles.exampleChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>{ex}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Existing rules */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your rules</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
          ) : rules.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No rules yet. Add one above and the assistant starts watching offers for you.
            </Text>
          ) : (
            rules.map((rule) => (
              <View key={rule.id} style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule.ruleText}</Text>
                  {rule.parsed?.summary && rule.parsed.summary !== rule.ruleText && (
                    <Text style={[styles.ruleSummary, { color: colors.mutedForeground }]}>
                      Understood as: {rule.parsed.summary}
                    </Text>
                  )}
                </View>
                <View style={styles.ruleControls}>
                  <Switch
                    value={rule.active}
                    onValueChange={() => void toggleRule(rule)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor="#fff"
                  />
                  <Pressable onPress={() => deleteRule(rule)} accessibilityRole="button" accessibilityLabel="Delete rule">
                    <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <ApiErrorDialog message={error} onClose={() => setError(null)} title="Assistant" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  consentCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14 },
  consentText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  draftCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, gap: 10 },
  draftTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  draftIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  draftTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  draftMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  draftWhy: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  draftActions: { flexDirection: "row", gap: 10 },
  draftBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  draftBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 70, textAlignVertical: "top" },
  createBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  exampleWrap: { gap: 8 },
  exampleChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  exampleText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  ruleCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  ruleText: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 19 },
  ruleSummary: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ruleControls: { alignItems: "center", gap: 10 },
});
