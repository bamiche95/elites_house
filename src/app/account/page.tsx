import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Package, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ORDER_STATUS_META } from "@/lib/constants";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");

  const [orders, addressCount, spend, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, paymentStatus: "PAID" },
      _sum: { totalPence: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Orders placed", value: String(orders), icon: Package, href: "/account/orders" },
    {
      label: "Lifetime spend",
      value: formatMoney(spend._sum.totalPence ?? 0),
      icon: Sparkles,
      href: "/account/orders",
    },
    {
      label: "Saved addresses",
      value: String(addressCount),
      icon: MapPin,
      href: "/account/addresses",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group border border-line bg-cream p-5 transition-colors hover:border-ink"
          >
            <stat.icon className="h-4 w-4 text-gold" />
            <p className="mt-4 font-display text-3xl text-espresso">{stat.value}</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-espresso">Recent orders</h2>
            <p className="mt-1 text-sm text-mocha">
              Track, review or reorder your latest pieces.
            </p>
          </div>
          <Link
            href="/account/orders"
            className="shrink-0 text-[0.62rem] uppercase tracking-[0.16em] text-espresso underline underline-offset-4"
          >
            All orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="mt-5 border border-dashed border-line bg-cream px-6 py-14 text-center">
            <p className="font-display text-2xl text-espresso">No orders yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">
              When you place your first order it will appear here with live tracking.
            </p>
            <ButtonLink href="/shop" className="mt-6">
              Shop the collection
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {recentOrders.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="group flex flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="text-sm text-espresso">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-mocha">
                        {formatDate(order.createdAt)} ·{" "}
                        {order.items.reduce((total, item) => total + item.quantity, 0)} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? order.status}</Badge>
                      <span className="text-sm text-espresso">
                        {formatMoney(order.totalPence)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-mocha transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border border-line bg-cream p-6">
        <p className="eyebrow">Atelier tip</p>
        <p className="mt-2 font-display text-2xl text-espresso">
          Silk at night is the difference between good hair and great hair.
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha">
          Braid loosely and wrap in silk or satin. It prevents most tangling and keeps your
          bundles glossy for longer.
        </p>
        <ButtonLink href="/hair-care" variant="outline" className="mt-5">
          Read the care guide
        </ButtonLink>
      </section>
    </div>
  );
}
