import { openai } from "@workspace/integrations-openai-ai-server";

const MODEL = "gpt-5.6-terra";

/** Screens the assistant may deep-link to. Anything else is dropped. */
export const ALLOWED_ROUTES = [
  "/(tabs)/rewards",
  "/(tabs)/activity",
  "/top-up",
  "/send-money",
  "/receive-money",
  "/merchant-pay",
  "/assistant-rules",
] as const;

export interface AssistantLink {
  label: string;
  route: string;
  offerId?: number;
}

export interface ChatGrounding {
  firstName: string;
  balanceCents: number;
  rewardPoints: number;
  transactions: Array<{
    type: string;
    status: string;
    amountCents: number;
    pointsDelta: number;
    description: string;
    createdAt: string;
  }>;
  offers: Array<{
    id: number;
    merchant: string;
    title: string;
    category: string;
    pointsCost: number;
    expiresAt: string;
    redeemed: boolean;
  }>;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("ASSISTANT_BAD_RESPONSE");
  return JSON.parse(text.slice(start, end + 1));
}

/** Answers a fan question grounded in their real wallet data. */
export async function answerFanQuestion(
  grounding: ChatGrounding,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  question: string,
): Promise<{ reply: string; links: AssistantLink[] }> {
  const system = `You are the RewLo assistant inside a sports-fan wallet app. Answer questions using ONLY the fan's real data below. Amounts are integer cents (divide by 100 for dollars; 1 USD = 1 RWLO). Points are RewLo Points.

FAN DATA:
Name: ${grounding.firstName}
Balance: ${grounding.balanceCents} cents | Points: ${grounding.rewardPoints}
Recent transactions (newest first): ${JSON.stringify(grounding.transactions)}
Available offers: ${JSON.stringify(grounding.offers)}

Rules:
- Be concise (max ~3 short sentences), friendly, concrete with numbers.
- Never invent transactions or offers that are not in the data.
- If asked about something outside the data, say what you can see and suggest where to look.
- Respond with JSON only: {"reply": string, "links": [{"label": string, "route": string, "offerId"?: number}]}
- links: 0-3 helpful deep links. route MUST be one of: ${ALLOWED_ROUTES.join(", ")}. Use "/(tabs)/rewards" with offerId when pointing at a specific offer.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      ...history.slice(-10),
      { role: "user", content: question },
    ],
  });
  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw) as { reply?: unknown; links?: unknown };
  const reply = typeof parsed.reply === "string" && parsed.reply.trim()
    ? parsed.reply.trim()
    : "I could not work that out from your wallet data. Try rephrasing?";
  const links: AssistantLink[] = Array.isArray(parsed.links)
    ? parsed.links
        .filter(
          (l): l is { label: string; route: string; offerId?: number } =>
            !!l && typeof l === "object" &&
            typeof (l as { label?: unknown }).label === "string" &&
            typeof (l as { route?: unknown }).route === "string" &&
            (ALLOWED_ROUTES as readonly string[]).includes((l as { route: string }).route),
        )
        .slice(0, 3)
        .map((l) => ({
          label: l.label,
          route: l.route,
          ...(typeof l.offerId === "number" ? { offerId: l.offerId } : {}),
        }))
    : [];
  return { reply, links };
}

export interface ParsedRule {
  summary: string;
  categories: string[];
  merchants: string[];
  keywords: string[];
  maxPointsCost: number | null;
}

/** Parses a fan's plain-language standing rule into matchable constraints. */
export async function parseStandingRule(
  ruleText: string,
  knownCategories: string[],
  knownMerchants: string[],
): Promise<ParsedRule> {
  const system = `You convert a sports fan's plain-language standing instruction into structured offer-matching constraints for the RewLo rewards wallet.

Known offer categories: ${knownCategories.join(", ") || "(none)"}
Known merchants: ${knownMerchants.join(", ") || "(none)"}

Respond with JSON only:
{"summary": string (one short sentence restating the rule),
 "categories": string[] (subset of known categories that apply, [] if any),
 "merchants": string[] (subset of known merchants that apply, [] if any),
 "keywords": string[] (lowercase words to match in offer titles/descriptions, [] if none),
 "maxPointsCost": number|null (max points the fan will spend per offer; null if unspecified — treat dollar limits as points, 1 point ≈ 1 cent is WRONG: if the fan states a dollar cap like "$70", set maxPointsCost to null and add relevant keywords instead)}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: ruleText },
    ],
  });
  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw) as Partial<ParsedRule>;
  const strings = (v: unknown) =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, 10) : [];
  return {
    summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : ruleText,
    categories: strings(parsed.categories),
    merchants: strings(parsed.merchants),
    keywords: strings(parsed.keywords).map((k) => k.toLowerCase()),
    maxPointsCost:
      typeof parsed.maxPointsCost === "number" && Number.isFinite(parsed.maxPointsCost) && parsed.maxPointsCost > 0
        ? Math.round(parsed.maxPointsCost)
        : null,
  };
}
