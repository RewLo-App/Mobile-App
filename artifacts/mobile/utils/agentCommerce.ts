export type MerchantCategory = "Stadium" | "Sports" | "Media" | "Gaming" | "Food" | "Other";

export interface AgentStep {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
}

export interface AgentRecommendation {
  action: "apply" | "save";
  pointsToApply: number;
  savingsAmount: number;
  effectivePrice: number;
  pointValueCents: number;
  reasoning: string;
  bonusActive: boolean;
  bonusLabel: string | null;
  stripePaymentIntentId: string;
  steps: AgentStep[];
}

export interface PurchaseContext {
  amount: number;
  merchantName: string;
  merchantCategory: MerchantCategory;
  pointBalance: number;
  clubName?: string;
}

const POINT_VALUE_TABLE: Record<MerchantCategory, number> = {
  Stadium: 0.8,
  Sports:  1.0,
  Media:   0.5,
  Gaming:  0.5,
  Food:    0.7,
  Other:   0.5,
};

const BONUS_EVENTS = [
  { label: "Game Day 2× Bonus", multiplier: 2.0, active: true },
  { label: "Weekend Fan Boost", multiplier: 1.5, active: false },
];

function mockStripePaymentIntentId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "RWL-";
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function runAgentAnalysis(ctx: PurchaseContext): AgentRecommendation {
  const baseValueCents = POINT_VALUE_TABLE[ctx.merchantCategory];
  const bonus = BONUS_EVENTS.find((e) => e.active) ?? null;
  const multiplier = bonus ? bonus.multiplier : 1;
  const effectiveValueCents = baseValueCents * multiplier;

  const maxAffordablePoints = Math.floor((ctx.amount * 100) / effectiveValueCents);
  const pointsToApply = Math.min(ctx.pointBalance, maxAffordablePoints);
  const savingsAmount = parseFloat(((pointsToApply * effectiveValueCents) / 100).toFixed(2));
  const effectivePrice = parseFloat((ctx.amount - savingsAmount).toFixed(2));
  const savingsPct = ctx.amount > 0 ? savingsAmount / ctx.amount : 0;
  const shouldApply = pointsToApply >= 50 && savingsAmount >= 1.0;

  let reasoning: string;
  if (!shouldApply) {
    reasoning = `Your point balance is low for this purchase. Save points for a Stadium or Sports merchant to get a better conversion rate.`;
  } else if (bonus && ctx.merchantCategory === "Stadium") {
    reasoning = `${bonus.label} is active — each point is worth $${(effectiveValueCents / 100).toFixed(3)} here, ${((multiplier - 1) * 100).toFixed(0)}% more than usual. This is the optimal time to redeem.`;
  } else if (ctx.merchantCategory === "Sports") {
    reasoning = `Sports merchants offer the highest point value at $${(effectiveValueCents / 100).toFixed(3)}/pt. Applying points here maximises your return.`;
  } else {
    reasoning = `Applying ${pointsToApply.toLocaleString()} points saves you $${savingsAmount.toFixed(2)} (${(savingsPct * 100).toFixed(0)}% off) at a strong redemption rate for this category.`;
  }

  const piId = mockStripePaymentIntentId();

  const steps: AgentStep[] = [
    {
      id: "ctx",
      label: "Fetching purchase context",
      detail: `$${ctx.amount.toFixed(2)} at ${ctx.merchantName} · ${ctx.merchantCategory}`,
      durationMs: 650,
    },
    {
      id: "bal",
      label: "Checking point balance",
      detail: `${ctx.pointBalance.toLocaleString()} Rewlo Points available · never expire`,
      durationMs: 480,
    },
    {
      id: "val",
      label: "Calculating point value",
      detail: `${ctx.merchantCategory}: $${(baseValueCents / 100).toFixed(3)}/pt${bonus ? ` × ${multiplier}× ${bonus.label}` : ""}`,
      durationMs: 750,
    },
    {
      id: "bonus",
      label: "Scanning for bonus events",
      detail: bonus
        ? `✓ ${bonus.label} active — ${multiplier}× multiplier applied`
        : "No active bonus events",
      durationMs: 580,
    },
    {
      id: "opt",
      label: "Optimising redemption strategy",
      detail: shouldApply
        ? `Apply ${pointsToApply.toLocaleString()} pts → save $${savingsAmount.toFixed(2)} (${(savingsPct * 100).toFixed(0)}% off)`
        : "Saving points recommended for a higher-value opportunity",
      durationMs: 880,
    },
    {
      id: "stripe",
      label: "Preparing secure checkout",
      detail: `Ref ${piId} · RewLo Pay`,
      durationMs: 620,
    },
  ];

  return {
    action: shouldApply ? "apply" : "save",
    pointsToApply: shouldApply ? pointsToApply : 0,
    savingsAmount: shouldApply ? savingsAmount : 0,
    effectivePrice: shouldApply ? effectivePrice : ctx.amount,
    pointValueCents: effectiveValueCents,
    reasoning,
    bonusActive: !!bonus,
    bonusLabel: bonus?.label ?? null,
    stripePaymentIntentId: piId,
    steps,
  };
}

export const DEMO_PURCHASES = [
  { label: "Stadium Catering", emoji: "🌭", merchantName: "Etihad Stadium Catering", merchantCategory: "Stadium" as MerchantCategory, amount: 45.00  },
  { label: "Club Jersey",      emoji: "👕", merchantName: "MCFC Official Store",      merchantCategory: "Sports"  as MerchantCategory, amount: 89.99  },
  { label: "Match Ticket",     emoji: "🎟️", merchantName: "Rewlo Tickets",            merchantCategory: "Stadium" as MerchantCategory, amount: 120.00 },
  { label: "Training Gear",    emoji: "⚽", merchantName: "Nike Fan Zone",            merchantCategory: "Sports"  as MerchantCategory, amount: 65.00  },
  { label: "Fan TV Pass",      emoji: "📺", merchantName: "Sky Sports",               merchantCategory: "Media"   as MerchantCategory, amount: 19.99  },
  { label: "Stadium Parking",  emoji: "🅿️", merchantName: "Etihad Parking",           merchantCategory: "Stadium" as MerchantCategory, amount: 25.00  },
];
