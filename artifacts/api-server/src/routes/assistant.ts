import { Router } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  assistantRulesTable,
  conversations,
  db,
  draftedActionsTable,
  messages,
  nudgesTable,
  offerCategoriesTable,
  offersTable,
  usersTable,
} from "@workspace/db";
import { BraleApiError } from "../services/brale-service";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { authenticatedUserId } from "../middleware/identity";
import { answerFanQuestion, parseStandingRule, type ChatGrounding } from "../services/assistant-ai";
import { generateNudges, runStandingRules } from "../services/assistant-engine";
import { redeemOfferForUser } from "../services/redemption-service";

const router = Router();
router.use("/assistant", requireAuth, requireRole("Fan"));

// ---------- Chat (Mode B: conversational query) ----------

router.post("/assistant/chat", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const question = String(req.body?.message ?? "").trim();
  const requestedConversationId = Number(req.body?.conversationId) || null;
  if (!question || question.length > 1000) {
    res.status(400).json({ error: "Enter a question (up to 1000 characters)" });
    return;
  }
  try {
    let conversationId = requestedConversationId;
    if (conversationId) {
      const [owned] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.id, conversationId), eq(conversations.userId, id)));
      if (!owned) { res.status(404).json({ error: "Conversation not found" }); return; }
    } else {
      const [created] = await db
        .insert(conversations)
        .values({ userId: id, title: question.slice(0, 80) })
        .returning({ id: conversations.id });
      conversationId = created!.id;
    }

    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        balanceCents: usersTable.rewloCashBalance,
        rewardPoints: usersTable.rewloPoints,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const txRows = await db.execute(sql`
      SELECT type::text AS type, status::text AS status, amount_cents, reward_points_delta,
             COALESCE(description, 'Transaction') AS description, created_at
      FROM wallet_transactions WHERE user_id=${id}
      ORDER BY created_at DESC LIMIT 15
    `);
    const offerRows = await db.execute(sql`
      SELECT o.id, o.merchant, o.title, oc.name AS category, o.points_required, o.expires_at,
             (r.id IS NOT NULL) AS redeemed
      FROM offers o
      JOIN offer_categories oc ON oc.id = o.category_id
      LEFT JOIN offer_redemptions r ON r.offer_id = o.id AND r.user_id=${id}
      WHERE o.available = true AND o.expires_at > now()
      ORDER BY o.expires_at ASC LIMIT 25
    `);
    const grounding: ChatGrounding = {
      firstName: user.firstName,
      balanceCents: user.balanceCents,
      rewardPoints: user.rewardPoints,
      transactions: txRows.rows.map((r) => ({
        type: String(r.type),
        status: String(r.status),
        amountCents: Number(r.amount_cents),
        pointsDelta: Number(r.reward_points_delta),
        description: String(r.description),
        createdAt: new Date(String(r.created_at)).toISOString(),
      })),
      offers: offerRows.rows.map((r) => ({
        id: Number(r.id),
        merchant: String(r.merchant),
        title: String(r.title),
        category: String(r.category),
        pointsCost: Number(r.points_required),
        expiresAt: new Date(String(r.expires_at)).toISOString().slice(0, 10),
        redeemed: Boolean(r.redeemed),
      })),
    };

    const priorMessages = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(10);
    const history = priorMessages
      .reverse()
      .filter((m): m is { role: "user" | "assistant"; content: string } =>
        m.role === "user" || m.role === "assistant");

    const answer = await answerFanQuestion(grounding, history, question);

    await db.insert(messages).values([
      { conversationId, role: "user", content: question },
      { conversationId, role: "assistant", content: JSON.stringify(answer) },
    ]);
    res.json({ conversationId, ...answer });
  } catch (error) {
    req.log.error({ error }, "Assistant chat failed");
    res.status(502).json({ error: "The assistant is unavailable right now. Please try again." });
  }
});

router.get("/assistant/chat/history", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.userId, id))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  if (!conversation) { res.json({ conversationId: null, messages: [] }); return; }
  const rows = await db
    .select({ id: messages.id, role: messages.role, content: messages.content, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(messages.createdAt);
  res.json({
    conversationId: conversation.id,
    messages: rows.map((m) => {
      if (m.role === "assistant") {
        try {
          const parsed = JSON.parse(m.content) as { reply?: string; links?: unknown[] };
          return { id: m.id, role: m.role, content: parsed.reply ?? m.content, links: parsed.links ?? [], createdAt: m.createdAt };
        } catch {
          // Fall through for legacy plain-text rows.
        }
      }
      return { id: m.id, role: m.role, content: m.content, links: [], createdAt: m.createdAt };
    }),
  });
});

// ---------- Nudges (Mode A: proactive nudges) ----------

router.get("/assistant/nudges", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  try {
    await generateNudges(id);
  } catch (error) {
    req.log.warn({ error }, "Nudge generation failed; serving existing nudges");
  }
  const rows = await db
    .select({
      id: nudgesTable.id,
      kind: nudgesTable.kind,
      title: nudgesTable.title,
      body: nudgesTable.body,
      offerId: nudgesTable.offerId,
      status: nudgesTable.status,
      createdAt: nudgesTable.createdAt,
    })
    .from(nudgesTable)
    .where(and(eq(nudgesTable.userId, id), inArray(nudgesTable.status, ["pending", "seen"])))
    .orderBy(desc(nudgesTable.createdAt))
    .limit(10);
  res.json({ nudges: rows, unseenCount: rows.filter((n) => n.status === "pending").length });
});

router.post("/assistant/nudges/:id/respond", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const nudgeId = Number(req.params.id);
  const action = String(req.body?.action ?? "");
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  if (!Number.isSafeInteger(nudgeId) || !["seen", "accepted", "dismissed"].includes(action)) {
    res.status(400).json({ error: "Invalid nudge response" });
    return;
  }
  const [updated] = await db
    .update(nudgesTable)
    .set({ status: action as "seen" | "accepted" | "dismissed", respondedAt: new Date() })
    .where(and(eq(nudgesTable.id, nudgeId), eq(nudgesTable.userId, id)))
    .returning({ id: nudgesTable.id });
  if (!updated) { res.status(404).json({ error: "Nudge not found" }); return; }
  res.json({ ok: true });
});

// ---------- Standing rules (Mode C: agentic redemption) ----------

router.get("/assistant/rules", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const rules = await db
    .select()
    .from(assistantRulesTable)
    .where(eq(assistantRulesTable.userId, id))
    .orderBy(desc(assistantRulesTable.createdAt));
  res.json({ rules });
});

router.post("/assistant/rules", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const ruleText = String(req.body?.ruleText ?? "").trim();
  if (!ruleText || ruleText.length > 500) {
    res.status(400).json({ error: "Describe your rule in up to 500 characters" });
    return;
  }
  const existing = await db
    .select({ id: assistantRulesTable.id })
    .from(assistantRulesTable)
    .where(and(eq(assistantRulesTable.userId, id), eq(assistantRulesTable.active, true)));
  if (existing.length >= 10) {
    res.status(409).json({ error: "You can keep up to 10 active rules. Pause one first." });
    return;
  }
  try {
    const categories = await db.select({ name: offerCategoriesTable.name }).from(offerCategoriesTable);
    const merchants = await db.selectDistinct({ merchant: offersTable.merchant }).from(offersTable);
    const parsed = await parseStandingRule(
      ruleText,
      categories.map((c) => c.name),
      merchants.map((m) => m.merchant),
    );
    const [rule] = await db
      .insert(assistantRulesTable)
      .values({ userId: id, ruleText, parsed })
      .returning();
    // Draft immediately so the fan sees matches right away.
    await runStandingRules(id).catch((error) => req.log.warn({ error }, "Rule matching failed after create"));
    res.status(201).json({ rule });
  } catch (error) {
    req.log.error({ error }, "Rule parsing failed");
    res.status(502).json({ error: "Could not understand that rule right now. Please try again." });
  }
});

router.patch("/assistant/rules/:id", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const ruleId = Number(req.params.id);
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  if (!Number.isSafeInteger(ruleId) || typeof req.body?.active !== "boolean") {
    res.status(400).json({ error: "Invalid rule update" });
    return;
  }
  const [updated] = await db
    .update(assistantRulesTable)
    .set({ active: req.body.active })
    .where(and(eq(assistantRulesTable.id, ruleId), eq(assistantRulesTable.userId, id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json({ rule: updated });
});

router.delete("/assistant/rules/:id", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const ruleId = Number(req.params.id);
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const [deleted] = await db
    .delete(assistantRulesTable)
    .where(and(eq(assistantRulesTable.id, ruleId), eq(assistantRulesTable.userId, id)))
    .returning({ id: assistantRulesTable.id });
  if (!deleted) { res.status(404).json({ error: "Rule not found" }); return; }
  res.json({ ok: true });
});

// ---------- Drafted actions (one-tap confirm; never auto-paid) ----------

router.get("/assistant/drafted-actions", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  try {
    await runStandingRules(id);
  } catch (error) {
    req.log.warn({ error }, "Rule matching failed; serving existing drafts");
  }
  // Drafts for offers that expired or were redeemed elsewhere silently expire.
  await db.execute(sql`
    UPDATE assistant_drafted_actions ada
    SET status='expired', resolved_at=now()
    FROM offers o
    WHERE ada.offer_id = o.id AND ada.user_id=${id} AND ada.status='proposed'
      AND (o.available = false OR o.expires_at <= now()
           OR EXISTS (SELECT 1 FROM offer_redemptions r WHERE r.user_id=${id} AND r.offer_id=o.id))
  `);
  const rows = await db.execute(sql`
    SELECT ada.id, ada.summary, ada.status, ada.created_at,
           o.id AS offer_id, o.merchant, o.title, o.discount_label, o.points_required, o.expires_at,
           ar.rule_text
    FROM assistant_drafted_actions ada
    JOIN offers o ON o.id = ada.offer_id
    JOIN assistant_rules ar ON ar.id = ada.rule_id
    WHERE ada.user_id=${id} AND ada.status='proposed'
    ORDER BY ada.created_at DESC LIMIT 10
  `);
  res.json({
    draftedActions: rows.rows.map((r) => ({
      id: Number(r.id),
      summary: String(r.summary),
      ruleText: String(r.rule_text),
      createdAt: new Date(String(r.created_at)).toISOString(),
      offer: {
        id: Number(r.offer_id),
        merchant: String(r.merchant),
        title: String(r.title),
        discount: String(r.discount_label),
        pointsCost: Number(r.points_required),
        expiresAt: new Date(String(r.expires_at)).toISOString().slice(0, 10),
      },
    })),
  });
});

router.post("/assistant/drafted-actions/:id/confirm", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const actionId = Number(req.params.id);
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  if (!Number.isSafeInteger(actionId)) { res.status(400).json({ error: "Invalid action" }); return; }
  const [action] = await db
    .select()
    .from(draftedActionsTable)
    .where(
      and(
        eq(draftedActionsTable.id, actionId),
        eq(draftedActionsTable.userId, id),
        eq(draftedActionsTable.status, "proposed"),
      ),
    );
  if (!action) { res.status(404).json({ error: "This suggestion is no longer available" }); return; }
  try {
    // Explicit fan consent happened via this request; money moves only here,
    // through the same redemption path as a manual redeem.
    const result = await redeemOfferForUser(id, action.offerId);
    await db
      .update(draftedActionsTable)
      .set({ status: "confirmed", resolvedAt: new Date() })
      .where(eq(draftedActionsTable.id, actionId));
    res.status(201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "NOT_FOUND" || m === "ALREADY_REDEEMED") {
      await db
        .update(draftedActionsTable)
        .set({ status: "expired", resolvedAt: new Date() })
        .where(eq(draftedActionsTable.id, actionId));
    }
    req.log.error({ e }, "Drafted action confirm failed");
    const providerError = e instanceof BraleApiError ? e : null;
    res
      .status(m === "INSUFFICIENT_POINTS" || m === "WALLET_NOT_CONFIGURED" ? 409 : m === "NOT_FOUND" || m === "ALREADY_REDEEMED" ? 410 : 502)
      .json({
        error:
          m === "INSUFFICIENT_POINTS"
            ? "Not enough points"
            : m === "NOT_FOUND" || m === "ALREADY_REDEEMED"
              ? "This offer is no longer available"
              : m === "WALLET_NOT_CONFIGURED"
                ? "Brale wallet is not configured"
                : providerError?.message ?? "Confirmation failed",
      });
  }
});

router.post("/assistant/drafted-actions/:id/dismiss", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const actionId = Number(req.params.id);
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const [updated] = await db
    .update(draftedActionsTable)
    .set({ status: "dismissed", resolvedAt: new Date() })
    .where(
      and(
        eq(draftedActionsTable.id, actionId),
        eq(draftedActionsTable.userId, id),
        eq(draftedActionsTable.status, "proposed"),
      ),
    )
    .returning({ id: draftedActionsTable.id });
  if (!updated) { res.status(404).json({ error: "Suggestion not found" }); return; }
  res.json({ ok: true });
});

export default router;
