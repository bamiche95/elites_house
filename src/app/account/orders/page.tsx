import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-helpers";
import { ORDER_STATUS_META } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await requireUser("/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-espresso">Your orders</h2>
          <p className="mt-1 text-sm text-mocha">
            Every order, its status and tracking in one place.
          </p>
        </div>
        <ButtonLink href="/shop" variant="outline" size="sm">
          Continue shopping
        </ButtonLink>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 border border-dashed border-line bg-cream px-6 py-16 text-center">
          <p className="font-display text-2xl text-espresso">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">
            Your first order will appear here as soon as you check out.
          </p>
          <ButtonLink href="/shop" className="mt-6">
            Shop the collection
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const meta = ORDER_STATUS_META[order.status];
            return (
              <li key={order.id} className="border border-line bg-ivory">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
                      Order {order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-mocha">
                      Placed {formatDate(order.createdAt)} ·{" "}
                      {order.items.reduce((total, item) => total + item.quantity, 0)} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? order.status}</Badge>
                    <span className="text-sm text-espresso">{formatMoney(order.totalPence)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-16 w-14 overflow-hidden bg-cream"
                      >
                        <Image
                          src={item.imageUrl ?? "/images/product-p1.jpg"}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 ? (
                      <span className="text-xs text-mocha">+{order.items.length - 4}</span>
                    ) : null}
                  </div>

                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso hover:text-gold"
                  >
                    View details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
