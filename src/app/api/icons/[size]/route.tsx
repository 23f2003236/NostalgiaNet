import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supported icon sizes for PWA manifest, apple-touch-icon, and favicons.
// Each size is generated on-demand via @vercel/og and cached by Vercel's CDN.
const VALID: Record<string, number> = {
  "16": 16, "32": 32, "48": 48, "72": 72,
  "96": 96, "128": 128, "144": 144, "152": 152,
  "180": 180, "192": 192, "256": 256, "384": 384, "512": 512,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = VALID[size] ?? 192;
  const radius = Math.round(px * 0.22);
  const showLabel = px >= 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2a1f17 0%, #3d2a1a 100%)",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            fontSize: Math.round(px * 0.44),
            lineHeight: 1,
            display: "flex",
          }}
        >
          &#x23F3;
        </div>
        {showLabel && (
          <div
            style={{
              fontSize: Math.round(px * 0.13),
              fontWeight: 700,
              color: "#c9844a",
              letterSpacing: "0.04em",
              display: "flex",
              marginTop: Math.round(px * 0.04),
            }}
          >
            N++
          </div>
        )}
      </div>
    ),
    { width: px, height: px }
  );
}