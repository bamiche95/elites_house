import { NextResponse } from "next/server";

import { validateCoupon } from "@/lib/coupons";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { couponApplySchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`coupon:${clientIp(request)}`, 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; subtotalPence?: unknown }
    | null;

  const parsed = couponApplySchema.safeParse(body);
  const subtotalPence = Number(body?.subtotalPence);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid code." }, { status: 422 });
  }
  if (!Number.isFinite(subtotalPence) || subtotalPence < 0) {
    return NextResponse.json({ ok: false, error: "Invalid basket total." }, { status: 422 });
  }

  const result = await validateCoupon(parsed.data.code, Math.round(subtotalPence));

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    coupon: { code: result.coupon.code },
    discountPence: result.discountPence,
    message: result.message,
  });
}
