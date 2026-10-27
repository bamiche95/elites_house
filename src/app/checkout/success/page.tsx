import type { Metadata } from "next";
import Link from "next/link";
import { Check, Mail, Package, Truck } from "lucide-react";

import { StripeConfirm } from "@/components/checkout/stripe-confirm";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ORDER_STATUS_META, PAYMENT_PROVIDER_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { formatDate, formatMoneyExact } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Order confirmed",
  description: "Thank you for your LushTresses order.",
  path: "/checkout/success",
  noIndex: true,
});

export const dynamic = "force-dynamic";

function addressBlock(value: unknown) {
  const address = (value ?? {}) as Record<string, string | undefined>;
  return (
    <address className="not-italic text-sm leading-relaxed text-mocha">
      {[
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
        ))}
    </address>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment_intent?: string }>;
}) {
  const { order: orderNumber, payment_intent: paymentIntentId } = await searchParams;

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true, user: { select: { passwordHash: true } } },
      })
    : null;

  if (!order) {
    return (
      <div className="container-luxe py-24 text-center">
        <p className="eyebrow">Thank you</p>
        <h1 className="mt-3 font-display text-4xl text-espresso">Your order is confirmed</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-mocha">
          Your confirmation email has the full details. If you can&apos;t find it, check your
          spam folder or contact the atelier.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account/orders">View your orders</ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    );
  }

  const status = ORDER_STATUS_META[order.status] ?? {
    label: order.status,
    tone: "neutral" as const,
    description: "",
  };
  const firstName = order.customerName.split(" ")[0];
  const deliveryCost =
    order.shippingPence === 0
      ? "Free"
      : formatMoneyExact(order.shippingPence, order.currency);

  return (
    <>
      <section className="border-b border-line bg-cream py-14">
        <div className="container-luxe">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-7 w-7" />
            </span>
            <div>
              <p className="eyebrow">Order {order.orderNumber}</p>
              <h1 className="mt-2 font-display text-4xl text-espresso sm:text-5xl">
                Thank you, {firstName}.
              </h1>
              <p className="mt-2 text-sm text-mocha">
                Placed {formatDate(order.createdAt)} · A confirmation email is on its way to{" "}
                <span className="text-espresso">{order.customerEmail}</span>.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
            {order.paymentProvider ? (
              <Badge tone="outline">
                {PAYMENT_PROVIDER_LABELS[order.paymentProvider] ?? order.paymentProvider}
              </Badge>
            ) : null}
            {paymentIntentId ? <StripeConfirm paymentIntentId={paymentIntentId} /> : null}
          </div>
        </div>
      </section>

      <section className="container-luxe grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          <h2 className="font-display text-2xl text-espresso">Your order</h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm text-espresso">{item.name}</p>
                  <p className="text-xs text-mocha">
                    {item.variantLabel} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm text-espresso">
                  {formatMoneyExact(item.lineTotalPence, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-sm">
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
                Delivering to
              </p>
              <div className="mt-2">{addressBlock(order.shippingAddress)}</div>
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
              <p className="text-xs text-mocha">
                {order.shippingMethod === "EXPRESS"
                  ? "Next working day"
                  : "2 – 4 working days"}{" "}
                · {deliveryCost}
              </p>
              {order.trackingNumber ? (
                <p className="mt-2 text-xs text-mocha">
                  Tracking: <span className="text-espresso">{order.trackingNumber}</span> (
                  {order.trackingCarrier})
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-4 border border-line bg-cream p-6">
          <h2 className="font-display text-xl text-espresso">What happens next</h2>
          {[
            {
              icon: Mail,
              title: "Confirmation email",
              copy: "Your receipt and order details are on their way now.",
            },
            {
              icon: Package,
              title: "Hand-checked & packed",
              copy: "Our atelier checks, weighs and wraps your hair within one working day.",
            },
            {
              icon: Truck,
              title: "Tracked dispatch",
              copy: "You'll get a tracking number by email the moment it ships.",
            },
          ].map((step) => (
            <div key={step.title} className="flex gap-3 border-t border-line pt-4">
              <step.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="text-sm text-espresso">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-mocha">{step.copy}</p>
              </div>
            </div>
          ))}

          {!order.user?.passwordHash ? (
            <div className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-mocha">
              We&apos;ve created an account for you. Use the one-click link in your
              confirmation email to set a password and track this order.
            </div>
          ) : null}

          <div className="grid gap-2 pt-2">
            <ButtonLink href="/account/orders" className="w-full">
              View your orders
            </ButtonLink>
            <ButtonLink href="/shop" variant="outline" className="w-full">
              Continue shopping
            </ButtonLink>
          </div>
          <p className="text-[0.65rem] leading-relaxed text-mocha">
            Need to change something?{" "}
            <Link href="/contact" className="underline underline-offset-2">
              Contact the atelier
            </Link>{" "}
            — we usually reply within one working day.
          </p>
        </aside>
      </section>
    </>
  );
}


