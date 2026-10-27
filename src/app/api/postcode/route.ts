import { NextResponse } from "next/server";

import { lookupPostcode } from "@/lib/postcode";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { postcodeSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = rateLimit(`postcode:${clientIp(request)}`, 30, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many lookups. Try again shortly." }, { status: 429 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = postcodeSchema.safeParse(query);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid postcode." },
      { status: 422 },
    );
  }

  const result = await lookupPostcode(parsed.data);

  if (!result) {
    return NextResponse.json(
      { error: "We couldn't find that postcode. Please enter your address manually." },
      { status: 404 },
    );
  }

  return NextResponse.json({ result });
}
