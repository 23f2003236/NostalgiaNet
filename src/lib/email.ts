// Email sending via Resend (https://resend.com)
// Falls back to console.log when RESEND_API_KEY is not configured

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "onboarding@resend.dev";

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "placeholder_set_in_production") {
    // Local dev fallback — log instead of actually sending
    console.log(`[email:dev] → ${to}\nSubject: ${subject}\n---\n${html}\n---`);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function unlockEmailHtml({
  userName,
  vaultTitle,
  vaultDescription,
  unlockUrl,
}: {
  userName: string;
  vaultTitle: string;
  vaultDescription?: string | null;
  unlockUrl: string;
}): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #fdfaf3; color: #2a1f17;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: #f3e8d4; color: #8b4513; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">NostalgiaNet++</div>
      </div>
      <h1 style="font-size: 28px; margin: 0 0 16px; color: #2a1f17;">Today is the day, ${userName}.</h1>
      <p style="font-size: 16px; line-height: 1.7; color: #5c4a3a;">
        Your sealed time capsule <strong style="color: #8b4513;">"${vaultTitle}"</strong>
        is ready to be opened. The moment you sealed away has finally arrived.
      </p>
      ${vaultDescription ? `<p style="font-size: 15px; line-height: 1.7; color: #5c4a3a; font-style: italic; padding: 16px; background: #f3e8d4; border-radius: 12px; margin: 24px 0;">${vaultDescription}</p>` : ""}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${unlockUrl}" style="display: inline-block; padding: 14px 32px; background: #8b4513; color: #fdfaf3; text-decoration: none; border-radius: 999px; font-weight: 600; font-family: -apple-system, sans-serif;">Open my capsule</a>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #8b7a6a; text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8d9c0;">
        You received this email because a memory you sealed is now ready.<br />
        <a href="${unlockUrl}" style="color: #8b4513;">Open NostalgiaNet++</a> to revisit all your moments.
      </p>
    </div>
  `;
}
