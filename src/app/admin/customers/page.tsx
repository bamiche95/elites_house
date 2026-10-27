import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQuery } = await searchParams;
  const q = rawQuery?.trim() ?? "";

  const customers = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { orders: true } },
      orders: { where: { paymentStatus: "PAID" }, select: { totalPence: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-espresso">Customers</h1>
        <p className="mt-1 text-sm text-mocha">
          {customers.length} accounts · guest buyers are included so their orders stay linked.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-center gap-2 border border-line bg-cream p-3"
      >
        <div className="flex min-w-56 flex-1 items-center gap-2 border border-line bg-ivory px-3">
          <Search className="h-4 w-4 text-mocha" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email"
            className="h-10 border-0 bg-transparent px-0 focus:border-0"
          />
        </div>
        <Button type="submit" size="sm" className="h-10">
          Search
        </Button>
        {q ? (
          <Link
            href="/admin/customers"
            className="text-[0.62rem] uppercase tracking-[0.14em] text-mocha underline underline-offset-4"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-cream text-[0.6rem] uppercase tracking-[0.16em] text-mocha">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => {
              const spend = customer.orders.reduce(
                (total, order) => total + order.totalPence,
                0,
              );
              return (
                <tr key={customer.id} className="bg-ivory">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-espresso hover:text-gold"
                    >
                      {customer.name ?? "Guest"}
                    </Link>
                    <p className="text-[0.65rem] text-mocha">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">{customer._count.orders}</td>
                  <td className="px-4 py-3 text-xs text-espresso">{formatMoney(spend)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.role === "ADMIN" ? <Badge tone="gold">Admin</Badge> : null}
                      {customer.passwordHash ? (
                        <Badge tone="success">Account</Badge>
                      ) : (
                        <Badge tone="neutral">Guest</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-mocha">
                  No customers match that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
