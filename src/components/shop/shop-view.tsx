import type { Prisma, Texture } from "@prisma/client";
import Link from "next/link";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/shop/pagination";
import { ActiveFilterChips, SortSelect } from "@/components/shop/shop-toolbar";
import { ShopFilters } from "@/components/shop/shop-filters";
import { activeBannerWhere } from "@/lib/banners";
import { TEXTURES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCard } from "@/lib/product-view";
import { cn } from "@/lib/utils";

export type ShopSearchParams = Record<string, string | string[] | undefined>;

export type ShopCategory = {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
};

const PAGE_SIZE = 12;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function ShopView({
  searchParams,
  category,
}: {
  searchParams: ShopSearchParams;
  category?: ShopCategory;
}) {
  const q = first(searchParams.q)?.trim() ?? "";
  const textureParam = first(searchParams.texture);
  const lengthParam = Number(first(searchParams.length));
  const minParam = Number(first(searchParams.minPrice));
  const maxParam = Number(first(searchParams.maxPrice));
  const sortParam = first(searchParams.sort) ?? "featured";
  const pageParam = Number(first(searchParams.page));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const texture = TEXTURES.some((item) => item.value === textureParam)
    ? (textureParam as Texture)
    : undefined;
  const length = Number.isFinite(lengthParam) && lengthParam > 0 ? lengthParam : undefined;
  const minPrice = Number.isFinite(minParam) && minParam > 0 ? minParam : undefined;
  const maxPrice = Number.isFinite(maxParam) && maxParam > 0 ? maxParam : undefined;

  const filters: Prisma.ProductWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    });
  }
  if (texture) filters.push({ texture });
  if (category) filters.push({ category: { slug: category.slug } });

  if (length || minPrice || maxPrice) {
    filters.push({
      variants: {
        some: {
          isActive: true,
          ...(length ? { lengthInches: length } : {}),
          ...(minPrice || maxPrice
            ? {
                pricePence: {
                  ...(minPrice ? { gte: minPrice } : {}),
                  ...(maxPrice ? { lte: maxPrice } : {}),
                },
              }
            : {}),
        },
      },
    });
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filters.length ? { AND: filters } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sortParam === "newest"
      ? [{ createdAt: "desc" }]
      : sortParam === "price-asc"
        ? [{ basePricePence: "asc" }]
        : sortParam === "price-desc"
          ? [{ basePricePence: "desc" }]
          : sortParam === "rating"
            ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }]
            : [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { ratingAvg: "desc" }];

  const [products, total, categories, heroBanner] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    prisma.banner.findFirst({
      where: activeBannerWhere("SHOP_HERO"),
      orderBy: { position: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const makeHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (texture) params.set("texture", texture);
    if (length) params.set("length", String(length));
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (sortParam !== "featured") params.set("sort", sortParam);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    const path = category ? `/shop/${category.slug}` : "/shop";
    return query ? `${path}?${query}` : path;
  };

  const title = category?.name ?? heroBanner?.title ?? "Shop all hair";
  const description =
    category?.description ??
    heroBanner?.subtitle ??
    "Double-drawn bundles, glueless wigs and HD lace closures — hand-finished in London.";

  return (
    <>
      <section className="border-b border-line bg-cream py-10 sm:py-14">
        <div className="container-luxe">
          <Breadcrumbs
            items={[
              { label: "Shop", href: category ? "/shop" : undefined },
              ...(category ? [{ label: category.name }] : []),
            ]}
          />
          <p className="eyebrow mt-7">{category ? "Collection" : "The atelier"}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-espresso sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mocha">{description}</p>
        </div>
      </section>

      <div className="container-luxe py-10">
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
          <aside className="space-y-8">
            <nav aria-label="Product categories">
              <h2 className="mb-3 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
                Categories
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/shop"
                    className={cn(
                      "text-sm transition-colors hover:text-espresso",
                      !category ? "text-espresso" : "text-mocha",
                    )}
                  >
                    All hair
                  </Link>
                </li>
                {categories.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/shop/${item.slug}`}
                      className={cn(
                        "text-sm transition-colors hover:text-espresso",
                        category?.slug === item.slug ? "text-espresso" : "text-mocha",
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Suspense fallback={null}>
              <ShopFilters />
            </Suspense>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <p className="text-[0.66rem] uppercase tracking-[0.16em] text-mocha">
                {total} {total === 1 ? "piece" : "pieces"}
                {page > 1 ? ` · page ${page}` : ""}
              </p>
              <Suspense fallback={null}>
                <SortSelect />
              </Suspense>
            </div>

            <div className="mt-4 min-h-6">
              <Suspense fallback={null}>
                <ActiveFilterChips />
              </Suspense>
            </div>

            <ProductGrid
              products={products.map(toProductCard)}
              className="mt-8"
              emptyMessage={
                q ? `Nothing matches “${q}” yet.` : "Nothing matches those filters yet."
              }
            />

            <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
          </div>
        </div>
      </div>
    </>
  );
}

