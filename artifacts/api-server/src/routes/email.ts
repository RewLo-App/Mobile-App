import { Router } from "express";
import nodemailer from "nodemailer";
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
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="width:64px;height:64px;background:#2563EB;border-radius:16px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:30px;font-weight:900;line-height:64px;">R</span>
                  </td>
                </tr>
              </table>
              <h1 style="color:#fff;font-size:26px;margin:0 0 6px;font-weight:800;">Welcome to Rewlo!</h1>
              <p style="color:rgba(255,255,255,0.8);margin:0;font-size:15px;">Your sports fan wallet is ready 🏆</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${name},</p>
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Your Rewlo account is all set. You can now pay at the stadium, earn loyalty points with
                <strong style="color:#fff;">${teamName}</strong>, and manage your fan finances — all in one place.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://rewlo.io"
                       style="background:#2563EB;color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                      Open your wallet →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6B8BAE;font-size:12px;text-align:center;margin:0;">
                If you didn't sign up for Rewlo, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="color:#6B8BAE;font-size:11px;margin:0;">© 2025 Rewlo · Your Sports Fan Wallet</p>
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
    let transporter: nodemailer.Transporter;
    let isTest = false;

    if (
      process.env["SMTP_HOST"] &&
      process.env["SMTP_USER"] &&
      process.env["SMTP_PASS"]
    ) {
      transporter = nodemailer.createTransport({
        host: process.env["SMTP_HOST"],
        port: Number(process.env["SMTP_PORT"] ?? 587),
        secure: process.env["SMTP_SECURE"] === "true",
        auth: {
          user: process.env["SMTP_USER"],
          pass: process.env["SMTP_PASS"],
        },
      });
    } else {
      // Use Ethereal test account for demo — no credentials needed
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      isTest = true;
    }

    const info = await transporter.sendMail({
      from: '"Rewlo" <noreply@rewlo.io>',
      to: email,
      subject: `Welcome to Rewlo, ${displayName}! 🏆`,
      html: buildEmailHtml(displayName, team, gradStart, gradEnd),
    });

    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      req.log.info({ previewUrl }, "Welcome email preview (Ethereal test)");
    }

    res.json({ success: true, previewUrl: previewUrl || null });
  } catch (err) {
    req.log.error({ err }, "Failed to send welcome email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
