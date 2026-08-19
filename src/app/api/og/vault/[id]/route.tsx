import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";
import { db } from "@/lib/db";

// Generate a 1200x630 share-card image for a vault.
// Rendered server-side via @vercel/og (Satori under the hood).
// Used by <meta og:image> when sharing the public vault page.
// NOTE: must run on the Node.js runtime — Prisma client doesn't work on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const vault = await db.vault.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      coverImage: true,
      unlockAt: true,
      isPublic: true,
      isSealed: true,
      category: true,
      createdAt: true,
      user: { select: { name: true } },
      memories: true,
    },
  });

  if (!vault || !vault.isPublic) {
    return new Response("Not found", { status: 404 });
  }

  const isUnlocked = new Date(vault.unlockAt) <= new Date();
  const unlockDate = new Date(vault.unlockAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const headline = isUnlocked ? "A memory just unlocked" : "Sealed until";
  const subheadline = isUnlocked
    ? `${vault.memories.length} ${vault.memories.length === 1 ? "memory" : "memories"} waiting to be revisited`
    : unlockDate;

  // Cover image as background — only for unlocked vaults.
  // For sealed vaults the cover photo must not be exposed via the share card,
  // so we fall back to the warm gradient (same as the no-image path).
  // Satori/@vercel/og requires ABSOLUTE URLs to fetch images server-side —
  // a relative path like /uploads/foo.jpg won't resolve.
  const baseUrl =
    process.env.PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const absoluteCover = isUnlocked && vault.coverImage
    ? vault.coverImage.startsWith("http")
      ? vault.coverImage
      : `${baseUrl}${vault.coverImage}`
    : null;

  const coverStyle: React.CSSProperties = absoluteCover
    ? {
        backgroundImage: `url(${absoluteCover})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(135deg, #8b4513 0%, #b8743a 50%, #c9844a 100%)",
      };

  // Satori requires explicit display:flex on every div with >1 child.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            ...coverStyle,
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(20,12,5,0.95) 0%, rgba(20,12,5,0.6) 50%, rgba(20,12,5,0.3) 100%)",
          }}
        />
        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: "100%",
            padding: "60px",
            color: "white",
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              ⏳
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                display: "flex",
              }}
            >
              NostalgiaNet++
            </div>
          </div>

          {/* Category chip */}
          {vault.category ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "6px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.15)",
                fontSize: "16px",
                marginBottom: "16px",
                textTransform: "capitalize",
              }}
            >
              {vault.category}
            </div>
          ) : null}

          {/* Headline */}
          <div
            style={{
              fontSize: "28px",
              opacity: 0.85,
              marginBottom: "8px",
              fontStyle: "italic",
              display: "flex",
            }}
          >
            {headline}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: "16px",
              maxWidth: "1000px",
              display: "flex",
            }}
          >
            {vault.title.length > 60
              ? vault.title.substring(0, 60) + "..."
              : vault.title}
          </div>

          {/* Subheadline */}
          <div
            style={{
              fontSize: "28px",
              opacity: 0.85,
              marginBottom: "20px",
              display: "flex",
            }}
          >
            {subheadline}
          </div>

          {/* Footer row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              paddingTop: "24px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "22px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "22px",
                  background: "linear-gradient(135deg, #8b4513, #c9844a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                {vault.user.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div style={{ display: "flex" }}>by {vault.user.name}</div>
            </div>
            <div
              style={{
                fontSize: "20px",
                opacity: 0.7,
                fontStyle: "italic",
                display: "flex",
              }}
            >
              {isUnlocked ? "🔓 Just unlocked" : "🔒 Still sealed"}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
