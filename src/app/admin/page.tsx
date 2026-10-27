import Link from "next/link";
import { ArrowRight, Mail, Package, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ORDER_STATUS_META } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, formatMoneyExact } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    lifetime,
    month,
    orderCount,
    activeOrders,
    customerCount,
    pendingReviews,
    unreadMessages,
    lowStock,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalPence: true } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", paidAt: { gte: monthStart } },
      _sum: { totalPence: true },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING"] } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.productVariant.findMany({
      where: { isActive: true, stock: { lte: 3 } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 6,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true, lineTotalPence: true },
      orderBy: { _sum: { lineTotalPence: "desc" } },
      take: 5,
    }),
  ]);

  const stats = [
    {
      label: "Lifetime revenue",
      value: formatMoney(lifetime._sum.totalPence ?? 0),
      hint: `${formatMoney(month._sum.totalPence ?? 0)} this month`,
      icon: TrendingUp,
    },
    {
      label: "Orders",
      value: String(orderCount),
      hint: `${activeOrders} in progress`,
      icon: Package,
    },
    {
      label: "Customers",
      value: String(customerCount),
      hint: "Registered accounts",
      icon: Users,
    },
    {
      label: "Needs attention",
      value: String(pendingReviews + unreadMessages),
      hint: `${pendingReviews} reviews · ${unreadMessages} messages`,
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">Overview</h1>
          <p className="mt-1 text-sm text-mocha">
            A read on the atelier — revenue, orders and stock.
          </p>
        </div>
        <ButtonLink href="/admin/products/new" size="sm">
          Add a product
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-cream p-5">
            <stat.icon className="h-4 w-4 text-gold" />
            <p className="mt-4 font-display text-3xl text-espresso">{stat.value}</p>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
              {stat.label}
            </p>
            <p className="mt-2 text-xs text-mocha/80">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-espresso">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-[0.62rem] uppercase tracking-[0.16em] text-espresso underline underline-offset-4"
          >
            All orders
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="bg-cream text-[0.6rem] uppercase tracking-[0.16em] text-mocha">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentOrders.map((order) => {
                const meta = ORDER_STATUS_META[order.status];
                return (
                  <tr key={order.id} className="bg-ivory">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-espresso hover:text-gold"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-[0.65rem] text-mocha">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-espresso">{order.customerName}</p>
                      <p className="text-[0.65rem] text-mocha">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? order.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-espresso">
                      {formatMoneyExact(order.totalPence)}
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-mocha">
                    No orders yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-espresso">Low stock</h2>
            <Link
              href="/admin/products"
              className="text-[0.6rem] uppercase tracking-[0.14em] text-mocha hover:text-espresso"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {lowStock.map((variant) => (
              <li key={variant.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-espresso">{variant.product.name}</p>
                  <p className="text-[0.65rem] text-mocha">
                    {variant.label} · {variant.sku}
                  </p>
                </div>
                <Badge tone={variant.stock === 0 ? "danger" : "warning"}>
                  {variant.stock === 0 ? "Sold out" : `${variant.stock} left`}
                </Badge>
              </li>
            ))}
            {lowStock.length === 0 ? (
              <li className="text-sm text-mocha">Everything is comfortably stocked.</li>
            ) : null}
          </ul>
        </section>

        <section className="border border-line p-5">
          <h2 className="font-display text-xl text-espresso">Top sellers</h2>
          <ul className="mt-4 space-y-3">
            {topProducts.map((product) => (
              <li key={product.name} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-espresso">{product.name}</p>
                  <p className="text-[0.65rem] text-mocha">
                    {product._sum.quantity ?? 0} units sold
                  </p>
                </div>
                <span className="text-espresso">
                  {formatMoney(product._sum.lineTotalPence ?? 0)}
                </span>
              </li>
            ))}
            {topProducts.length === 0 ? (
              <li className="text-sm text-mocha">No sales recorded yet.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="border border-line bg-cream p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-espresso">Housekeeping</h2>
            <p className="mt-1 text-xs text-mocha">
              Unpaid orders release their stock automatically after two hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/cms?tab=reviews"
              className="inline-flex items-center gap-2 border border-line bg-ivory px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-espresso"
            >
              Moderate reviews <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/cms?tab=inbox"
              className="inline-flex items-center gap-2 border border-line bg-ivory px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-espresso"
            >
              Inbox ({unreadMessages}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


