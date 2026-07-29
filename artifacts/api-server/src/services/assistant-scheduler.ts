import { eq } from "drizzle-orm";
import { assistantRulesTable, db } from "@workspace/db";
import { logger } from "../lib/logger";
import { generateNudges, runStandingRules } from "./assistant-engine";

const INTERVAL_MS = Number(process.env["ASSISTANT_SCHEDULER_INTERVAL_MS"] ?? 60_000);

let timer: NodeJS.Timeout | null = null;
let running = false;

/**
 * One sweep: evaluate every fan with at least one active standing rule.
 * Failures are logged per user and never propagate — the scheduler must
 * never crash the server.
 */
export async function runAssistantSweep(): Promise<void> {
  const rows = await db
    .selectDistinct({ userId: assistantRulesTable.userId })
    .from(assistantRulesTable)
    .where(eq(assistantRulesTable.active, true));

  for (const { userId } of rows) {
    try {
      await generateNudges(userId);
      await runStandingRules(userId);
    } catch (error) {
      logger.warn({ error, userId }, "Assistant sweep failed for user");
    }
  }
}

/** Starts the periodic background sweep. Idempotent. */
export function startAssistantScheduler(): void {
  if (timer) return;

  const tick = async () => {
    if (running) return; // never overlap sweeps
    running = true;
    try {
      await runAssistantSweep();
    } catch (error) {
      logger.error({ error }, "Assistant sweep failed");
    } finally {
      running = false;
    }
  };

  timer = setInterval(() => void tick(), INTERVAL_MS);
  timer.unref(); // never keep the process alive just for the sweep
  logger.info({ intervalMs: INTERVAL_MS }, "Assistant scheduler started");
  void tick();
}

/** Stops the scheduler (used by tests/shutdown). */
export function stopAssistantScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
