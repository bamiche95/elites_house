import { NextResponse } from "next/server";

import { allowDemoPayments } from "@/lib/env";
import { markOrderPaid } from "@/lib/payments/fulfilment";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!allowDemoPayments) {
    return NextResponse.json({ error: "Test payments are disabled." }, { status: 403 });
  }

  const limit = rateLimit(`checkout-demo:${clientIp(request)}`, 10, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { orderNumber?: string } | null;
  if (!body?.orderNumber) {
    return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: body.orderNumber },
    select: { id: true, orderNumber: true, totalPence: true, paymentStatus: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ orderNumber: order.orderNumber, alreadyPaid: true });
  }

  await markOrderPaid({
    orderId: order.id,
    provider: "DEMO",
    providerRef: `demo_${order.id}`,
    amountPence: order.totalPence,
  });

  return NextResponse.json({ orderNumber: order.orderNumber });
}
