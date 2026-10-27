import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Package, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-helpers";
import { ORDER_STATUS_META, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoneyExact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function addressLines(value: unknown) {
  const address = (value ?? {}) as Record<string, string | undefined>;
  return [
    address.fullName,
    address.line1,
    address.line2,
    address.city,
    address.county,
    address.postcode,
    address.country,
  ]
    .filter(Boolean)
    .map((line) => (
      <span key={String(line)} className="block">
        {line}
      </span>
    ));
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${orderNumber}`);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      payments: true,
    },
  });

  if (!order || (order.userId !== user.id && order.customerEmail !== user.email)) {
    notFound();
  }

  const meta = ORDER_STATUS_META[order.status];
  const deliveryCost =
    order.shippingPence === 0 ? "Free" : formatMoneyExact(order.shippingPence, order.currency);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-espresso">Order {order.orderNumber}</h2>
          <p className="mt-1 text-sm text-mocha">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? order.status}</Badge>
          <Badge tone="outline">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
        </div>
      </div>

      {meta?.description ? (
        <p className="mt-3 border-l-2 border-gold bg-cream px-4 py-3 text-sm text-mocha">
          {meta.description}
        </p>
      ) : null}

      {order.trackingNumber ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-line bg-ivory px-4 py-3">
          <Truck className="h-4 w-4 text-gold" />
          <p className="text-sm text-espresso">
            {order.trackingCarrier ?? "Royal Mail"} · {order.trackingNumber}
          </p>
          <span className="text-xs text-mocha">Tracking updates by email</span>
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h3 className="text-[0.62rem] uppercase tracking-[0.2em] text-mocha">Items</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-cream">
                  <Image
                    src={item.imageUrl ?? "/images/product-p1.jpg"}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-espresso">{item.name}</p>
                    <p className="mt-0.5 text-xs text-mocha">{item.variantLabel}</p>
                    <p className="mt-0.5 text-[0.65rem] text-mocha/70">
                      SKU {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm text-espresso">
                    {formatMoneyExact(item.lineTotalPence, order.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-mocha">
              <dt>Subtotal</dt>
              <dd className="text-espresso">
                {formatMoneyExact(order.subtotalPence, order.currency)}
              </dd>
            </div>
            {order.discountPence > 0 ? (
              <div className="flex justify-between text-success">
                <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                <dd>−{formatMoneyExact(order.discountPence, order.currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-mocha">
              <dt>Delivery</dt>
              <dd className="text-espresso">{deliveryCost}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="uppercase tracking-[0.14em] text-mocha">Total</dt>
              <dd className="text-espresso">
                {formatMoneyExact(order.totalPence, order.currency)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">
                Shipping address
              </p>
              <div className="mt-2 text-sm leading-relaxed text-mocha">
                {addressLines(order.shippingAddress)}
              </div>
            </div>
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">
                Delivery method
              </p>
              <p className="mt-2 text-sm text-espresso">
                {order.shippingMethod === "EXPRESS"
                  ? "Express next-day delivery"
                  : "Standard tracked delivery"}
              </p>
              <p className="mt-1 text-xs text-mocha">{deliveryCost}</p>
              {order.notes ? (
                <p className="mt-3 text-xs leading-relaxed text-mocha">Note: {order.notes}</p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-5 border border-line bg-cream p-6">
          <div>
            <h3 className="flex items-center gap-2 font-display text-xl text-espresso">
              <Package className="h-4 w-4 text-gold" /> Order timeline
            </h3>
            <ol className="mt-4 space-y-4">
              {order.events.map((event, index) => (
                <li key={event.id} className="flex gap-3">
                  <span
                    className={
                      index === order.events.length - 1
                        ? "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-ivory"
                        : "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-mocha"
                    }
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-xs capitalize text-espresso">
                      {event.type.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="mt-0.5 text-[0.68rem] leading-relaxed text-mocha">
                      {event.message}
                    </p>
                    <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-mocha/60">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {order.payments.length > 0 ? (
            <div className="border-t border-line pt-4 text-xs text-mocha">
              <p className="uppercase tracking-[0.14em]">Payments</p>
              {order.payments.map((payment) => (
                <p key={payment.id} className="mt-1">
                  {payment.provider} · {formatMoneyExact(payment.amountPence, order.currency)} ·{" "}
                  {payment.status}
                </p>
              ))}
            </div>
          ) : null}

          <div className="grid gap-2 border-t border-line pt-4">
            <ButtonLink href="/contact" variant="outline" className="w-full">
              Need help with this order?
            </ButtonLink>
            <ButtonLink href="/shop" className="w-full">
              Shop again
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

