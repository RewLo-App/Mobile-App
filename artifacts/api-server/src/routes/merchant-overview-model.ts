import { z } from "@workspace/api-zod";

const rangeSchema = z.object({
  range: z.enum(["7d", "30d", "90d", "custom"]).default("30d"),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
}).strict().superRefine((value, context) => {
  if (value.range === "custom" && (!value.from || !value.to)) context.addIssue({ code: "custom", message: "Custom ranges require from and to ISO timestamps.", path: ["range"] });
  if (value.from && value.to && new Date(value.from) > new Date(value.to)) context.addIssue({ code: "custom", message: "from must be before to.", path: ["from"] });
});
export type OverviewRange = { key: "7d" | "30d" | "90d" | "custom"; from: Date; to: Date };

export function parseOverviewRange(query: unknown, now = new Date()): OverviewRange {
  const parsed = rangeSchema.safeParse(query);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid date range.");
  const { range, from, to } = parsed.data;
  if (range === "custom") return { key: range, from: new Date(from!), to: new Date(to!) };
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return { key: range, from: new Date(now.getTime() - days * 86_400_000), to: now };
}

export type LedgerMetricInput = { entryType: string; status: string; pointsDelta: number; reserveDeltaCents: number };
export function calculateMerchantLedgerMetrics(entries: LedgerMetricInput[]) {
  return entries.reduce((totals, entry) => {
    if (entry.status !== "posted") return totals;
    totals.inCirculation += entry.pointsDelta;
    totals.netFloatCents += entry.reserveDeltaCents;
    if (entry.entryType === "issuance" && entry.pointsDelta > 0) totals.issued += entry.pointsDelta;
    if (entry.entryType === "redemption" && entry.pointsDelta < 0) totals.redeemed += Math.abs(entry.pointsDelta);
    return totals;
  }, { issued: 0, redeemed: 0, inCirculation: 0, netFloatCents: 0 });
}
