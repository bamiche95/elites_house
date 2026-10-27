import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_META } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, formatMoney, formatMoneyExact } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });

  if (!customer) notFound();

  const paidSpend = customer.orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + order.totalPence, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All customers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">
            {customer.name ?? "Guest buyer"}
          </h1>
          <p className="mt-1 text-sm text-mocha">{customer.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={customer.role === "ADMIN" ? "gold" : "neutral"}>{customer.role}</Badge>
          <Badge tone={customer.passwordHash ? "success" : "warning"}>
            {customer.passwordHash ? "Password set" : "Guest — no password"}
          </Badge>
          {customer.marketingOptIn ? <Badge tone="outline">Marketing opt-in</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Orders", value: String(customer.orders.length) },
          { label: "Paid spend", value: formatMoney(paidSpend) },
          { label: "Addresses", value: String(customer.addresses.length) },
          { label: "Joined", value: formatDate(customer.createdAt) },
        ].map((stat) => (
          <div key={stat.label} className="border border-line bg-cream p-4">
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-mocha">{stat.label}</p>
            <p className="mt-2 font-display text-xl text-espresso">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="border border-line">
        <h2 className="border-b border-line bg-cream px-4 py-3 text-[0.62rem] uppercase tracking-[0.18em] text-mocha">
          Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <tbody className="divide-y divide-line">
              {customer.orders.map((order) => {
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
                        {formatDateTime(order.createdAt)} · {order.items.length} line(s)
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={meta?.tone ?? "neutral"}>
                        {meta?.label ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-espresso">
                      {formatMoneyExact(order.totalPence)}
                    </td>
                  </tr>
                );
              })}
              {customer.orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-mocha">No orders yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-line p-4">
        <h2 className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">Addresses</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {customer.addresses.map((address) => (
            <div key={address.id} className="border border-line bg-cream p-3 text-xs text-mocha">
              <p className="text-sm text-espresso">{address.fullName}</p>
              <p className="mt-1 leading-relaxed">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}
                {address.county ? `, ${address.county}` : ""}
                <br />
                {address.postcode} · {address.country}
                <br />
                {address.phone}
              </p>
              {address.isDefault ? (
                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-gold">
                  Default
                </p>
              ) : null}
            </div>
          ))}
          {customer.addresses.length === 0 ? (
            <p className="text-xs text-mocha">No saved addresses.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
