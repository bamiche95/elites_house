import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { expireStaleOrders } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron target (see vercel.json). Releases stock reserved by abandoned
 * payment intents so inventory never gets stuck.
 */
export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (env.cronSecret) {
    if (authorization !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET must be configured in production." },
      { status: 503 },
    );
  }

  const released = await expireStaleOrders(2, 100);

  return NextResponse.json({
    released,
    ranAt: new Date().toISOString(),
  });
}
