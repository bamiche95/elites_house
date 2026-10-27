import { NextResponse } from "next/server";

import { resolveCart } from "@/lib/cart-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { cartSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`cart-validate:${clientIp(request)}`, 60, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Add at least one item to your bag.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const resolution = await resolveCart(parsed.data.items);
  return NextResponse.json(resolution);
}
