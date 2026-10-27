import type { Metadata } from "next";

import { ShopView, type ShopSearchParams } from "@/components/shop/shop-view";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const title = q ? `Search results for “${q}”` : "Shop luxury human hair";
  return buildMetadata({
    title,
    description:
      "Shop 100% Remy human hair bundles, HD lace wigs, closures and frontals. Free UK delivery over £150.",
    path: "/shop",
    keywords: ["buy human hair online UK", "Remy hair bundles", "HD lace wigs"],
  });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <ShopView searchParams={params} />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
          itemListJsonLd([
            { name: "Bundles", path: "/shop/bundles" },
            { name: "Wigs", path: "/shop/wigs" },
            { name: "Closures", path: "/shop/closures" },
            { name: "Frontals", path: "/shop/frontals" },
            { name: "Accessories", path: "/shop/accessories" },
          ]),
        ]}
      />
    </>
  );
}
