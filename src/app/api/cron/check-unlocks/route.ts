import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, unlockEmailHtml } from "@/lib/email";

// Vercel Cron hits this endpoint daily.
// In local dev, you can hit /api/cron/check-unlocks?secret=YOUR_CRON_SECRET manually.

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || "local-cron-secret";

  // Allow Authorization: Bearer header too (Vercel Cron convention)
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (secret !== expected && bearerSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Window: vaults that unlocked in the last 24 hours
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find sealed vaults whose unlockAt just passed and we haven't notified yet
  // (no notification with type=UNLOCK_REMINDER for this user/vault combo)
  const vaults = await db.vault.findMany({
    where: {
      isSealed: true,
      unlockAt: {
        lte: now,
        gte: since,
      },
    },
    include: {
      user: true,
      memories: true,
    },
    take: 100,
  });

  let notifiedCount = 0;
  let emailSent = 0;
  let emailSkipped = 0;
  let errors = 0;

  for (const vault of vaults) {
    // Per-vault dedup: skip if we already sent an UNLOCK_REMINDER for THIS vault.
    // The link field encodes the vault id (`/?vault=<id>`), so we scope on it
    // to avoid the bug where two vaults unlock on the same day and only one
    // gets a notification.
    const vaultLink = `/?vault=${vault.id}`;
    const existing = await db.notification.findFirst({
      where: {
        userId: vault.userId,
        type: "UNLOCK_REMINDER",
        link: vaultLink,
      },
    });
    if (existing) continue;

    const baseUrl =
      process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const unlockUrl = `${baseUrl}${vaultLink}`;

    // In-app notification
    await db.notification.create({
      data: {
        userId: vault.userId,
        type: "UNLOCK_REMINDER",
        title: `"${vault.title}" is now unlocked`,
        body: `A memory you sealed is ready to be revisited.`,
        link: vaultLink,
      },
    });

    // Mark vault as unsealed
    await db.vault.update({
      where: { id: vault.id },
      data: { isSealed: false },
    });

    // Send email
    const result = await sendEmail({
      to: vault.user.email,
      subject: `Your capsule "${vault.title}" is now unlocked`,
      html: unlockEmailHtml({
        userName: vault.user.name,
        vaultTitle: vault.title,
        vaultDescription: vault.description,
        unlockUrl,
      }),
    });

    if (result.ok && result.skipped) {
      emailSkipped++;
    } else if (result.ok) {
      emailSent++;
    } else {
      errors++;
      console.error(`[cron] email failed for ${vault.user.email}:`, result.error);
    }

    notifiedCount++;
  }

  return NextResponse.json({
    ok: true,
    checked: vaults.length,
    notified: notifiedCount,
    emailSent,
    emailSkipped,
    errors,
    timestamp: now.toISOString(),
  });
}
