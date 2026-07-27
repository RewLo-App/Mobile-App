import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  assistantApi,
  type AssistantLink,
} from "@/utils/assistantApi";
import { apiErrorMessage } from "@/utils/walletApi";

interface ChatMessage {
  key: string;
  role: "user" | "assistant";
  content: string;
  links: AssistantLink[];
}

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What offers can I afford right now?",
  "When does my next offer expire?",
];

function LinkChips({ links }: { links: AssistantLink[] }) {
  const colors = useColors();
  if (links.length === 0) return null;
  return (
    <View style={styles.chipRow}>
      {links.map((link) => (
        <Pressable
          key={`${link.route}-${link.label}`}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(link.route as never);
          }}
          style={[styles.chip, { backgroundColor: `${colors.primary}22`, borderColor: `${colors.primary}55` }]}
        >
          <Ionicons name="open-outline" size={13} color={colors.primary} />
          <Text style={[styles.chipText, { color: colors.primary }]}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AssistantChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    let active = true;
    assistantApi
      .chatHistory()
      .then((history) => {
        if (!active) return;
        setConversationId(history.conversationId);
        setMessages(
          history.messages.map((m) => ({
            key: `db-${m.id}`,
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
            links: m.links ?? [],
          })),
        );
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, []);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { key: `u-${Date.now()}`, role: "user", content: question, links: [] }]);
    try {
      const response = await assistantApi.chat(question, conversationId);
      setConversationId(response.conversationId);
      setMessages((prev) => [
        ...prev,
        { key: `a-${Date.now()}`, role: "assistant", content: response.reply, links: response.links },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          key: `e-${Date.now()}`,
          role: "assistant",
          content: apiErrorMessage(error, "The assistant is unavailable right now. Please try again."),
          links: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, sending]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>RewLo Assistant</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Answers from your real wallet data</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/assistant-rules" as never)}
          style={styles.rulesBtn}
          accessibilityRole="button"
          accessibilityLabel="My assistant rules"
        >
          <Ionicons name="options-outline" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user"
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}
            >
              <Text style={[styles.bubbleText, { color: item.role === "user" ? "#fff" : colors.foreground }]}>
                {item.content}
              </Text>
              {item.role === "assistant" && <LinkChips links={item.links} />}
            </View>
          )}
          ListEmptyComponent={
            loadingHistory ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}22` }]}>
                  <Ionicons name="sparkles" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ask me anything</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  I can see your balance, transactions, points, and live offers.
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => void send(s)}
                      style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )
          }
          ListFooterComponent={
            sending ? (
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />

        {/* Composer */}
        <View
          style={[
            styles.composer,
            { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 10 },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your wallet…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            editable={!sending}
            onSubmitEditing={() => void send(input)}
            returnKeyType="send"
            maxLength={1000}
          />
          <Pressable
            onPress={() => void send(input)}
            disabled={sending || !input.trim()}
            style={[styles.sendBtn, { backgroundColor: input.trim() && !sending ? colors.primary : colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  rulesBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  bubble: { maxWidth: "85%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 6 },
  assistantBubble: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyWrap: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 10 },
  suggestions: { gap: 8, alignSelf: "stretch" },
  suggestion: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  composer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
