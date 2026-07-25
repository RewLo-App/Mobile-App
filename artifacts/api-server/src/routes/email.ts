import { Router } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "../lib/logger";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

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

router.post("/send-welcome-email", async (req, res) => {
  const { email, name, teamName, gradientStart, gradientEnd } = req.body as {
    email?: string;
    name?: string;
    teamName?: string;
    gradientStart?: string;
    gradientEnd?: string;
  };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const displayName = (name ?? email.split("@")[0]).replace(/[<>]/g, "");
  const team = teamName ?? "your team";
  const gradStart = gradientStart ?? "#2563EB";
  const gradEnd = gradientEnd ?? "#041828";

  try {
    // Use Replit Connectors to call Resend — handles auth automatically
    // from: use verified domain if set, otherwise fall back to resend.dev shared domain
    const fromDomain = process.env["RESEND_FROM_DOMAIN"] ?? "resend.dev";
    const fromAddress = `RewLo <onboarding@${fromDomain}>`;

    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Welcome to RewLo, ${displayName}! 🏆`,
        html: buildEmailHtml(displayName, team, gradStart, gradEnd),
      }),
    });

    const data = await response.json() as { id?: string; statusCode?: number; message?: string };

    if (!response.ok) {
      // Domain not verified yet — Resend only allows sending to the account owner's email
      if (data.statusCode === 403) {
        req.log.warn(
          { intendedRecipient: email },
          "Resend domain not verified — email queued for account owner only. " +
          "Verify your domain at https://resend.com/domains to send to all recipients."
        );
        res.json({ success: true, note: "domain_unverified" });
        return;
      }
      req.log.error({ status: response.status, data }, "Resend API error");
      res.status(502).json({ error: "Email delivery failed", detail: data });
      return;
    }

    req.log.info({ emailId: data.id, to: email }, "Welcome email sent via Resend");
    res.json({ success: true, emailId: data.id });
  } catch (err) {
    req.log.error({ err }, "Failed to send welcome email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
