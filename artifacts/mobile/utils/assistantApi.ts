import { walletRequest } from "@/utils/walletApi";

export interface AssistantLink {
  label: string;
  route: string;
  offerId?: number;
}

export interface AssistantChatResponse {
  conversationId: number;
  reply: string;
  links: AssistantLink[];
}

export interface AssistantHistoryMessage {
  id: number;
  role: string;
  content: string;
  links: AssistantLink[];
  createdAt: string;
}

export interface AssistantNudge {
  id: number;
  kind: string;
  title: string;
  body: string;
  offerId: number | null;
  status: "pending" | "seen";
  createdAt: string;
}

export interface AssistantRule {
  id: number;
  ruleText: string;
  parsed: { summary?: string };
  active: boolean;
  createdAt: string;
}

export interface DraftedAction {
  id: number;
  summary: string;
  ruleText: string;
  createdAt: string;
  offer: {
    id: number;
    merchant: string;
    title: string;
    discount: string;
    pointsCost: number;
    expiresAt: string;
  };
}

export const assistantApi = {
  chat: (message: string, conversationId: number | null) =>
    walletRequest<AssistantChatResponse>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
    }),
  chatHistory: () =>
    walletRequest<{ conversationId: number | null; messages: AssistantHistoryMessage[] }>(
      "/api/assistant/chat/history",
    ),
  nudges: () =>
    walletRequest<{ nudges: AssistantNudge[]; unseenCount: number }>("/api/assistant/nudges"),
  respondToNudge: (id: number, action: "seen" | "accepted" | "dismissed") =>
    walletRequest<{ ok: boolean }>(`/api/assistant/nudges/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  rules: () => walletRequest<{ rules: AssistantRule[] }>("/api/assistant/rules"),
  createRule: (ruleText: string) =>
    walletRequest<{ rule: AssistantRule }>("/api/assistant/rules", {
      method: "POST",
      body: JSON.stringify({ ruleText }),
    }),
  updateRule: (id: number, active: boolean) =>
    walletRequest<{ rule: AssistantRule }>(`/api/assistant/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  deleteRule: (id: number) =>
    walletRequest<{ ok: boolean }>(`/api/assistant/rules/${id}`, { method: "DELETE" }),
  draftedActions: () =>
    walletRequest<{ draftedActions: DraftedAction[] }>("/api/assistant/drafted-actions"),
  confirmDraftedAction: (id: number) =>
    walletRequest<{ reference: string; points: number }>(
      `/api/assistant/drafted-actions/${id}/confirm`,
      { method: "POST", body: JSON.stringify({}) },
    ),
  dismissDraftedAction: (id: number) =>
    walletRequest<{ ok: boolean }>(`/api/assistant/drafted-actions/${id}/dismiss`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};
