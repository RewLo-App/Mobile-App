import { z } from "@workspace/api-zod";

export const batchRecipientSchema = z.object({ userId: z.number().int().positive(), points: z.number().int().positive(), sourceEventKey: z.string().trim().min(1).max(160).optional() }).strict();
export const bulkIssuanceSchema = z.object({ campaignId: z.number().int().positive(), idempotencyKey: z.string().trim().min(12).max(200), recipients: z.array(batchRecipientSchema).min(1).max(500) }).strict();
export type BatchRecipient = z.infer<typeof batchRecipientSchema>;
export function previewBatch(recipients: BatchRecipient[], remainingPoints: number, knownUserIds: Set<number>) {
  let remaining = remainingPoints; let estimated = 0;
  const results = recipients.map((recipient) => {
    if (!knownUserIds.has(recipient.userId)) return { ...recipient, status: "invalid" as const, reason: "Fan account not found", issuedPoints: 0 };
    if (recipient.points > remaining) return { ...recipient, status: "skipped" as const, reason: "Campaign budget cap would be exceeded", issuedPoints: 0 };
    remaining -= recipient.points; estimated += recipient.points;
    return { ...recipient, status: "ready" as const, reason: null, issuedPoints: recipient.points };
  });
  return { estimatedPoints: estimated, remainingAfter: remaining, results };
}
