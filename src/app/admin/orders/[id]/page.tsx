import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { updateOrderStatusAction } from "@/app/admin/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  ORDER_STATUS_META,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoneyExact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

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
    .join(", ");
}

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
      payments: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-mocha">
            {formatDateTime(order.createdAt)} · {order.items.length} line(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? order.status}</Badge>
          <Badge tone="outline">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
          {order.paymentProvider ? (
            <Badge tone="neutral">
              {PAYMENT_PROVIDER_LABELS[order.paymentProvider] ?? order.paymentProvider}
            </Badge>
          ) : null}
        </div>
      </div>

      {saved ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Order updated. The customer has been emailed if notifications were enabled.
        </p>
      ) : null}
      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="border border-line">
            <h2 className="border-b border-line bg-cream px-4 py-3 text-[0.62rem] uppercase tracking-[0.18em] text-mocha">
              Items
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm text-espresso">{item.name}</p>
                    <p className="text-xs text-mocha">
                      {item.variantLabel} · {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm text-espresso">
                    {formatMoneyExact(item.lineTotalPence, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-line px-4 py-3 text-sm">
              <div className="flex justify-between text-mocha">
                <dt>Subtotal</dt>
                <dd>{formatMoneyExact(order.subtotalPence, order.currency)}</dd>
              </div>
              {order.discountPence > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>−{formatMoneyExact(order.discountPence, order.currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-mocha">
                <dt>Shipping ({order.shippingMethod})</dt>
                <dd>
                  {order.shippingPence === 0
                    ? "Free"
                    : formatMoneyExact(order.shippingPence, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base text-espresso">
                <dt>Total</dt>
                <dd>{formatMoneyExact(order.totalPence, order.currency)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-line p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">Customer</h2>
            <div className="mt-3 space-y-1 text-sm text-espresso">
              <p>{order.customerName}</p>
              <p className="text-mocha">{order.customerEmail}</p>
              <p className="text-mocha">{order.customerPhone}</p>
              {order.user ? (
                <p className="text-xs text-mocha">
                  Account:{" "}
                  <Link
                    href={`/admin/customers/${order.user.id}`}
                    className="underline underline-offset-2"
                  >
                    {order.user.email}
                  </Link>{" "}
                  ({order.user.role})
                </p>
              ) : (
                <p className="text-xs text-mocha">No account linked</p>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-xs text-mocha sm:grid-cols-2">
              <div>
                <p className="uppercase tracking-[0.16em]">Shipping</p>
                <p className="mt-1 leading-relaxed">{addressLines(order.shippingAddress)}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.16em]">Billing</p>
                <p className="mt-1 leading-relaxed">{addressLines(order.billingAddress)}</p>
              </div>
            </div>
            {order.notes ? (
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-mocha">
                Customer note: {order.notes}
              </p>
            ) : null}
          </section>

          <section className="border border-line p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">Timeline</h2>
            <ol className="mt-3 space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-xs">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-mocha">
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-espresso">
                      {event.type.replace(/_/g, " ").toLowerCase()} · {event.actor}
                    </p>
                    <p className="text-mocha">{event.message}</p>
                    <p className="text-[0.6rem] uppercase tracking-[0.1em] text-mocha/60">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="h-fit space-y-4 border border-line bg-cream p-5">
          <h2 className="font-display text-xl text-espresso">Update order</h2>
          <form action={updateOrderStatusAction} className="space-y-4">
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="orderNumber" value={order.orderNumber} />

            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" defaultValue={order.status}>
                {Object.entries(ORDER_STATUS_META).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tracking number" htmlFor="trackingNumber">
                <Input
                  id="trackingNumber"
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ""}
                  maxLength={60}
                />
              </Field>
              <Field label="Carrier" htmlFor="trackingCarrier">
                <Input
                  id="trackingCarrier"
                  name="trackingCarrier"
                  defaultValue={order.trackingCarrier ?? "Royal Mail"}
                  maxLength={60}
                />
              </Field>
            </div>

            <Field label="Note to customer (optional)" htmlFor="note">
              <Textarea
                id="note"
                name="note"
                maxLength={500}
                className="min-h-20"
                placeholder="Added to the order timeline and email."
              />
            </Field>

            <Checkbox
              id="notifyCustomer"
              name="notifyCustomer"
              defaultChecked
              label="Email the customer about this update"
            />

            <Button type="submit" className="w-full">
              Save status
            </Button>
            <p className="text-[0.65rem] leading-relaxed text-mocha">
              Cancelling an order automatically returns its stock to inventory.
            </p>
          </form>

          {order.payments.length > 0 ? (
            <div className="border-t border-line pt-4 text-xs text-mocha">
              <p className="uppercase tracking-[0.14em]">Payments</p>
              {order.payments.map((payment) => (
                <p key={payment.id} className="mt-1">
                  {payment.provider} · {formatMoneyExact(payment.amountPence)} ·{" "}
                  {payment.status} · {payment.providerRef.slice(0, 18)}…
                </p>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}


