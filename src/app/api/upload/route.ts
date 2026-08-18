import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

// Allowed extensions and size limits
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB per file
// For base64 fallback (z.ai preview), limit to 2 MB to avoid huge DB rows
const MAX_BASE64_SIZE = 2 * 1024 * 1024;

function classifyType(ext: string): "IMAGE" | "VIDEO" {
  return [".mp4", ".webm", ".mov"].includes(ext) ? "VIDEO" : "IMAGE";
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  };
  return map[ext] || "application/octet-stream";
}

function hasFileSignature(buf: Buffer, ext: string): boolean {
  const startsWith = (...bytes: number[]) =>
    buf.length >= bytes.length && bytes.every((byte, index) => buf[index] === byte);
  const hasFtyp = buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp";

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case ".png":
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case ".gif":
      return buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a";
    case ".webp":
      return buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
    case ".mp4":
      return hasFtyp && buf.toString("ascii", 8, 12) !== "qt  ";
    case ".mov":
      return hasFtyp && buf.toString("ascii", 8, 12) === "qt  ";
    case ".webm":
      return startsWith(0x1a, 0x45, 0xdf, 0xa3);
    default:
      return false;
  }
}

// STORAGE STRATEGY (3-tier fallback):
// 1. Vercel Blob (BLOB_READ_WRITE_TOKEN is set) — production on Vercel
// 2. Local filesystem (public/uploads/) — local dev, works if writable
// 3. Base64 data URL — z.ai preview / any read-only filesystem
//
// The 3rd tier is critical for z.ai preview where the filesystem is
// read-only at runtime. writeFile() silently fails, so the file never
// gets written. Base64 embeds the image data directly in the URL,
// which gets stored in the DB and always renders in the browser.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: "Too many files in one upload. Max 20." },
        { status: 400 }
      );
    }

    // Daily upload limit: 3 files per day for non-admin users. Upload records
    // are created here, before files are attached to a vault, album, or avatar.
    const userRow = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = userRow?.role === "ADMIN";

    if (!isAdmin) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await db.upload.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      });
      const remaining = Math.max(0, 3 - recentCount);
      const newFilesCount = files.filter((f) => f instanceof File && (f as File).size > 0).length;
      if (newFilesCount > remaining) {
        return NextResponse.json(
          {
            error: remaining === 0
              ? "You've hit today's upload limit (3 photos/day). NostalgiaNet++ is still under construction — limits lift in January 2027. Come back tomorrow!"
              : `You can only upload ${remaining} more photo${remaining === 1 ? "" : "s"} today (3/day limit during construction). Try again tomorrow.`,
            remaining,
            limit: 3,
          },
          { status: 429 }
        );
      }
    }

    const uploaded: { url: string; type: string; name: string; size: number }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const f = file;
      if (!f.size) continue;

      if (f.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${f.name} is too large. Max 8 MB per file.` },
          { status: 413 }
        );
      }

      const ext = path.extname(f.name).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        return NextResponse.json(
          { error: `${f.name}: unsupported file type (${ext})` },
          { status: 415 }
        );
      }

      const buf = Buffer.from(await f.arrayBuffer());
      if (!hasFileSignature(buf, ext)) {
        return NextResponse.json(
          { error: `${f.name}: file content does not match its ${ext} extension.` },
          { status: 415 }
        );
      }
      const contentType = getContentType(ext);
      let url: string;
      let storageMethod = "unknown";

      if (useBlob) {
        // Tier 1: Vercel Blob (production)
        const safeBaseName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
        const blob = await put(`uploads/${safeBaseName}`, buf, {
          access: "public",
          contentType,
          addRandomSuffix: false,
        });
        url = blob.url;
        storageMethod = "blob";
      } else {
        // Tier 2: Try local filesystem first
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        const safeBaseName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
        const filePath = path.join(uploadDir, safeBaseName);
        const resolvedPath = path.resolve(filePath);
        const resolvedDir = path.resolve(uploadDir);

        // Security: verify path stays inside uploadDir
        if (!resolvedPath.startsWith(resolvedDir + path.sep) && resolvedPath !== resolvedDir) {
          return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
        }

        let writeSucceeded = false;
        try {
          if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
          }
          await writeFile(resolvedPath, buf);
          // Verify the file actually exists after writing
          if (existsSync(resolvedPath)) {
            writeSucceeded = true;
          }
        } catch {
          // writeFile failed — likely read-only filesystem (z.ai preview)
          writeSucceeded = false;
        }

        if (writeSucceeded) {
          // Tier 2 success: use absolute URL
          const origin = req.headers.get("x-forwarded-proto")
            ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`
            : `http://${req.headers.get("host")}`;
          url = `${origin}/uploads/${safeBaseName}`;
          storageMethod = "filesystem";
        } else {
          // Tier 3: Base64 data URL — works everywhere, no filesystem needed
          // This is the fallback for z.ai preview where filesystem is read-only.
          if (buf.length > MAX_BASE64_SIZE) {
            return NextResponse.json(
              { error: `${f.name} is too large for the preview server. Max 2 MB on demo. Try a smaller image or deploy to Vercel for full-size uploads.` },
              { status: 413 }
            );
          }
          const base64 = buf.toString("base64");
          url = `data:${contentType};base64,${base64}`;
          storageMethod = "base64";
        }
      }

      console.log(`[upload] ${f.name} → ${storageMethod} (${buf.length} bytes)`);

      uploaded.push({
        url,
        type: classifyType(ext),
        name: f.name,
        size: f.size,
      });
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        { error: "No valid files were uploaded" },
        { status: 400 }
      );
    }

    // Count every completed upload, including files later used for initial
    // vault/album creation and profile pictures. This prevents those flows
    // from bypassing the daily upload limit.
    await db.upload.createMany({
      data: uploaded.map(() => ({ userId })),
    });

    return NextResponse.json({ files: uploaded });
  } catch (e) {
    console.error("[upload] error", e);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
