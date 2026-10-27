import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { TEXTURE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const lowOnly = params.low === "1";

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(lowOnly ? { variants: { some: { stock: { lte: 3 } } } } : {}),
    },
    include: {
      category: { select: { name: true } },
      variants: { select: { stock: true, pricePence: true, isActive: true } },
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">Products</h1>
          <p className="mt-1 text-sm text-mocha">{products.length} pieces in the atelier</p>
        </div>
        <ButtonLink href="/admin/products/new" size="sm">
          <Plus className="h-3.5 w-3.5" /> New product
        </ButtonLink>
      </div>

      {params.saved ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Product saved.
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
            placeholder="Search products"
            className="h-10 border-0 bg-transparent px-0 focus:border-0"
          />
        </div>
        <Button type="submit" size="sm" className="h-10">
          Search
        </Button>
        <Link
          href={lowOnly ? "/admin/products" : "/admin/products?low=1"}
          className={
            lowOnly
              ? "border border-ink bg-ink px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-ivory"
              : "border border-line px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-mocha hover:border-ink hover:text-espresso"
          }
        >
          Low stock only
        </Link>
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-cream text-[0.6rem] uppercase tracking-[0.16em] text-mocha">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => {
              const stock = product.variants.reduce(
                (total, variant) => total + (variant.isActive ? variant.stock : 0),
                0,
              );
              return (
                <tr key={product.id} className="bg-ivory">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-espresso hover:text-gold"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[0.65rem] text-mocha">
                      {TEXTURE_LABELS[product.texture]} · /{product.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-mocha">{product.category.name}</td>
                  <td className="px-4 py-3 text-xs text-mocha">{product.variants.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        stock === 0
                          ? "text-xs text-danger"
                          : stock <= 5
                            ? "text-xs text-[#8a6535]"
                            : "text-xs text-mocha"
                      }
                    >
                      {stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-espresso">
                    {formatMoney(product.basePricePence)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={product.isActive ? "success" : "neutral"}>
                        {product.isActive ? "Live" : "Draft"}
                      </Badge>
                      {product.isFeatured ? <Badge tone="gold">Featured</Badge> : null}
                      {product.isBestSeller ? <Badge tone="outline">Best seller</Badge> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mocha">
                  No products yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

