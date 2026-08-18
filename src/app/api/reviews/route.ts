import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

// GET /api/reviews — public, returns approved 4-5 star reviews for landing page
// Returns max 15, newest first (old ones drop off when new ones come in)
export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: {
        isApproved: true,
        rating: { gte: 4 }, // only 4-5 stars on landing
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15, // max 15 on landing — old ones drop off
    });
    return NextResponse.json({ reviews });
  } catch (e) {
    console.error("[reviews GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/reviews — submit a review (auth required)
export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, comment } = body as {
      rating: number;
      comment?: string;
    };

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: "Comment must be under 500 characters" },
        { status: 400 }
      );
    }

    // Check if user already reviewed — one review per user
    const existing = await db.review.findFirst({
      where: { userId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You've already reviewed NostalgiaNet++. Thank you!" },
        { status: 409 }
      );
    }

    let review;
    try {
      review = await db.review.create({
        data: {
          userId,
          rating: Math.round(rating),
          comment: comment?.trim() || null,
          isApproved: false, // admin must approve before it shows on landing
        },
        include: {
          user: { select: { name: true, avatar: true } },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json(
          { error: "You've already reviewed NostalgiaNet++. Thank you!" },
          { status: 409 }
        );
      }
      throw e;
    }

    // Notify all admins that a new review was submitted
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "SHARED_VAULT", // reuse this type — it's for "something new arrived"
          title: `New ${rating}-star review from ${review.user.name}`,
          body: comment
            ? `"${comment.substring(0, 100)}${comment.length > 100 ? "..." : ""}"`
            : `Rated ${rating} out of 5 stars. Approve in Admin Panel.`,
          link: `/?view=admin`,
        },
      });
    }

    return NextResponse.json({ review });
  } catch (e) {
    console.error("[reviews POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
