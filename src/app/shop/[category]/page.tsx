import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ShopView, type ShopSearchParams } from "@/components/shop/shop-view";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

type Params = Promise<{ category: string }>;

async function getCategory(slug: string) {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return buildMetadata({ title: "Collection not found", noIndex: true });

  return buildMetadata({
    title: category.name,
    description:
      category.description ??
      category.tagline ??
      `Shop ${category.name.toLowerCase()} at LushTresses — 100% Remy human hair, hand-finished in London.`,
    path: `/shop/${category.slug}`,
    image: category.imageUrl ?? "/images/og-default.jpg",
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<ShopSearchParams>;
}) {
  const { category: slug } = await params;
  const search = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <>
      <ShopView
        searchParams={search}
        category={{
          slug: category.slug,
          name: category.name,
          tagline: category.tagline,
          description: category.description,
          imageUrl: category.imageUrl,
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/shop/${category.slug}` },
        ])}
      />
    </>
  );
}
