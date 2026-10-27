import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Price, RatingStars } from "@/components/ui/price";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  name: string;
  subtitle?: string | null;
  categoryName: string;
  basePricePence: number;
  compareAtPricePence?: number | null;
  ratingAvg: number;
  ratingCount: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  images: Array<{ url: string; alt: string }>;
  inStock: boolean;
};

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const primary = product.images[0];
  const secondary = product.images[1];

  return (
    <article className={cn("group", className)}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          <Image
            src={primary?.url ?? "/images/product-p1.jpg"}
            alt={primary?.alt ?? product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="object-cover transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-0"
          />
          {secondary ? (
            <Image
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.isBestSeller ? <Badge tone="gold">Best seller</Badge> : null}
            {product.isFeatured && !product.isBestSeller ? (
              <Badge tone="neutral">Atelier pick</Badge>
            ) : null}
            {!product.inStock ? <Badge tone="danger">Sold out</Badge> : null}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-mocha/80">
            {product.categoryName}
          </p>
          <h3 className="font-display text-xl leading-snug text-espresso transition-colors group-hover:text-gold">
            {product.name}
          </h3>
          {product.subtitle ? (
            <p className="line-clamp-1 text-xs text-mocha">{product.subtitle}</p>
          ) : null}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Price pence={product.basePricePence} compareAtPence={product.compareAtPricePence} />
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} size={12} />
          </div>
        </div>
      </Link>
    </article>
  );
}
