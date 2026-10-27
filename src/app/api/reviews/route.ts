import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`review:${clientIp(request)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your review." },
      { status: 422 },
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, isActive: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const user = await getSessionUser();
  let verifiedPurchase = false;

  if (user) {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId: user.id, paymentStatus: "PAID" },
      },
      select: { id: true },
    });
    verifiedPurchase = Boolean(purchase);
  }

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: user?.id ?? null,
      authorName: parsed.data.authorName.trim(),
      authorEmail: parsed.data.authorEmail?.toLowerCase().trim() || null,
      rating: parsed.data.rating,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body.trim(),
      status: "PENDING",
      verifiedPurchase,
    },
  });

  return NextResponse.json({ ok: true });
}
