import { Router } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { db, usersTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function buildEmailHtml(name: string, teamName: string, gradStart: string, gradEnd: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#020D1E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" style="background:#0B2040;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,${gradStart},${gradEnd});padding:40px;text-align:center;">
              <h1 style="color:#00E5CC;font-size:36px;margin:0 0 6px;font-weight:800;letter-spacing:-1px;">RewLo</h1>
              <p style="color:rgba(255,255,255,0.8);margin:0;font-size:15px;">Your sports fan wallet is ready 🏆</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${name},</p>
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 12px;">
                You're joining the founding fan community — the first fans to earn real money on every
                dollar they spend following <strong style="color:#fff;">${teamName}</strong>.
              </p>
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
                We're building this for fans exactly like you.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://rewlo.io"
                       style="background:#00E5CC;color:#020D1E;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                      rewlo.io →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6B8BAE;font-size:12px;text-align:center;margin:0;">
                If you didn't sign up for RewLo, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="color:#6B8BAE;font-size:11px;margin:0;">© 2025 RewLo · Your Sports Fan Wallet</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// POST /api/register — save user + send welcome email
router.post("/register", async (req, res) => {
  const { email, primaryClubId, followedClubIds, zip, teamName, gradientStart, gradientEnd } = req.body as {
    email?: string;
    primaryClubId?: string;
    followedClubIds?: string[];
    zip?: string;
    teamName?: string;
    gradientStart?: string;
    gradientEnd?: string;
  };

  if (!email || !primaryClubId) {
    res.status(400).json({ error: "email and primaryClubId are required" });
    return;
  }

  const displayName = email.split("@")[0].replace(/[<>]/g, "");
  const team = teamName ?? "your team";
  const gradStart = gradientStart ?? "#2563EB";
  const gradEnd = gradientEnd ?? "#041828";

  // Upsert user (ignore duplicate email — user re-installing the app)
  let userId: number;
  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      userId = existing[0].id;
      req.log.info({ userId, email }, "User already registered — skipping insert");
    } else {
      const inserted = await db
        .insert(usersTable)
        .values({
          email,
          primaryClubId,
          followedClubIds: JSON.stringify(followedClubIds ?? [primaryClubId]),
          zip: zip ?? null,
        })
        .returning({ id: usersTable.id });
      userId = inserted[0].id;
      req.log.info({ userId, email, primaryClubId }, "New user registered");
    }
  } catch (err) {
    req.log.error({ err }, "DB insert failed");
    res.status(500).json({ error: "Registration failed" });
    return;
  }

  // Send welcome email (non-blocking — don't fail registration if email fails)
  try {
    const fromDomain = process.env["RESEND_FROM_DOMAIN"] ?? "resend.dev";
    const connectors = new ReplitConnectors();
    const emailRes = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `RewLo <onboarding@${fromDomain}>`,
        to: [email],
        subject: `Welcome to RewLo, ${displayName}! 🏆`,
        html: buildEmailHtml(displayName, team, gradStart, gradEnd),
      }),
    });
    const emailData = await emailRes.json() as { id?: string };
    req.log.info({ emailId: emailData.id, to: email }, "Welcome email sent");
  } catch (err) {
    req.log.warn({ err }, "Welcome email failed (non-fatal)");
  }

  res.json({ success: true, userId });
});

// GET /api/admin/stats — enrollment overview
router.get("/admin/stats", async (req, res) => {
  try {
    const [totalRow] = await db.select({ total: count() }).from(usersTable);
    const recent = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        primaryClubId: usersTable.primaryClubId,
        zip: usersTable.zip,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(20);

    res.json({
      totalEnrollments: totalRow.total,
      recentSignups: recent,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
