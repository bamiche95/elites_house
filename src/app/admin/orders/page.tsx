import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { expireOrdersAction } from "@/app/admin/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { ORDER_STATUS_META, PAYMENT_PROVIDER_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoneyExact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
  expired?: string;
  error?: string;
}>;

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { trackingNumber: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, total, awaitingPayment] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { quantity: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] }, paymentStatus: "UNPAID" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">Orders</h1>
          <p className="mt-1 text-sm text-mocha">
            {total} order{total === 1 ? "" : "s"} · {awaitingPayment} awaiting payment
          </p>
        </div>
        <form action={expireOrdersAction}>
          <Button type="submit" variant="outline" size="sm">
            Release expired stock
          </Button>
        </form>
      </div>

      {params.expired ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Released stock for {params.expired} expired order{params.expired === "1" ? "" : "s"}.
        </p>
      ) : null}
      {params.error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {params.error}
        </p>
      ) : null}

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 border border-line bg-cream p-3"
      >
        <div className="flex min-w-56 flex-1 items-center gap-2 border border-line bg-ivory px-3">
          <Search className="h-4 w-4 text-mocha" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Order number, email, name or tracking"
            className="h-10 border-0 bg-transparent px-0 focus:border-0"
          />
        </div>
        <Select name="status" defaultValue={status} className="h-10 w-44">
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" className="h-10">
          Filter
        </Button>
        {q || status ? (
          <Link
            href="/admin/orders"
            className="text-[0.62rem] uppercase tracking-[0.14em] text-mocha underline underline-offset-4"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-cream text-[0.6rem] uppercase tracking-[0.16em] text-mocha">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => {
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
                    <p className="text-[0.65rem] text-mocha">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-espresso">{order.customerName}</p>
                    <p className="text-[0.65rem] text-mocha">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">
                    <p className="text-espresso">{order.paymentStatus}</p>
                    <p className="text-[0.65rem]">
                      {order.paymentProvider
                        ? PAYMENT_PROVIDER_LABELS[order.paymentProvider] ??
                          order.paymentProvider
                        : "—"}
                    </p>
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mocha">
                  No orders match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const query = new URLSearchParams();
            if (q) query.set("q", q);
            if (status) query.set("status", status);
            if (pageNumber > 1) query.set("page", String(pageNumber));
            return (
              <Link
                key={pageNumber}
                href={`/admin/orders${query.toString() ? `?${query}` : ""}`}
                className={
                  pageNumber === page
                    ? "flex h-9 w-9 items-center justify-center border border-ink bg-ink text-xs text-ivory"
                    : "flex h-9 w-9 items-center justify-center border border-line text-xs text-mocha hover:border-ink"
                }
              >
                {pageNumber}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

