import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Scissors, Shield, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ReviewForm } from "@/components/product/review-form";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/price";
import { TEXTURE_LABELS } from "@/lib/constants";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/jsonld";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCard } from "@/lib/product-view";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { where: { isActive: true }, orderBy: { pricePence: "asc" } },
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return buildMetadata({ title: "Product not found", noIndex: true });
  }

  return buildMetadata({
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.subtitle ?? product.description.slice(0, 155),
    path: `/product/${product.slug}`,
    image: product.images[0]?.url ?? "/images/og-default.jpg",
    keywords: [product.name, TEXTURE_LABELS[product.texture] ?? "", ...product.tags].filter(Boolean),
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    include: productCardInclude,
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  const inStockVariant = product.variants.find((variant) => variant.stock > 0);
  const detailsLines = (product.details ?? "").split("\n").filter(Boolean);

  return (
    <>
      <div className="border-b border-line">
        <div className="container-luxe py-5">
          <Breadcrumbs
            items={[
              { label: "Shop", href: "/shop" },
              { label: product.category.name, href: `/shop/${product.category.slug}` },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <section className="container-luxe grid gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14">
        <ProductGallery
          images={product.images.map((image) => ({ url: image.url, alt: image.alt }))}
          name={product.name}
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/shop/${product.category.slug}`}
              className="text-[0.62rem] uppercase tracking-[0.2em] text-gold"
            >
              {product.category.name}
            </Link>
            <span className="text-line">/</span>
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-mocha">
              {TEXTURE_LABELS[product.texture] ?? product.texture}
            </span>
            {product.isBestSeller ? <Badge tone="gold">Best seller</Badge> : null}
          </div>

          <h1 className="mt-3 font-display text-4xl leading-tight text-espresso sm:text-5xl">
            {product.name}
          </h1>
          {product.subtitle ? (
            <p className="mt-2 text-sm text-mocha">{product.subtitle}</p>
          ) : null}

          <div className="mt-4">
            <Link href="#reviews" className="inline-block">
              <RatingStars
                rating={product.ratingAvg}
                count={product.ratingCount}
                size={15}
                showValue
              />
            </Link>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-mocha">{product.description}</p>

          <div className="mt-7">
            <ProductPurchasePanel
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.images[0]?.url ?? "/images/product-p1.jpg",
                variants: product.variants.map((variant) => ({
                  id: variant.id,
                  label: variant.label,
                  pricePence: variant.pricePence,
                  compareAtPricePence: variant.compareAtPricePence,
                  stock: variant.stock,
                  sku: variant.sku,
                })),
              }}
            />
          </div>

          <ul className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Free UK delivery over £150" },
              { icon: Shield, label: "Secure Stripe & PayPal checkout" },
              { icon: Scissors, label: "Hand-checked in our atelier" },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-[0.7rem] text-mocha">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <Accordion
            className="mt-8"
            defaultOpenId="details"
            items={[
              {
                id: "details",
                title: "Details & specification",
                content:
                  detailsLines.length > 0 ? (
                    <ul className="space-y-1.5">
                      {detailsLines.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{product.description}</p>
                  ),
              },
              {
                id: "shipping",
                title: "Shipping & delivery",
                content: (
                  <div className="space-y-2">
                    <p>
                      Standard tracked delivery (2–4 working days) is £4.95, or free on orders
                      over £150. Express next-day delivery is £9.95 when ordered before 2pm.
                    </p>
                    <p>
                      Orders placed before 2pm are packed the same working day. International
                      shipping is calculated at checkout.
                    </p>
                  </div>
                ),
              },
              {
                id: "returns",
                title: "Returns & exchanges",
                content: (
                  <p>
                    Unworn hair in its original packaging can be returned within 30 days. Email
                    hello@lushtresses.com with your order number and we&apos;ll arrange it. Refunds
                    are processed within 3–5 working days.
                  </p>
                ),
              },
              {
                id: "care",
                title: "Care guidance",
                content: (
                  <p>
                    Co-wash with sulphate-free products, mask weekly, and wrap in silk or satin at
                    night. Keep heat tools under 200°C and always use a heat protectant. With care,
                    expect 12–18 months of wear.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </section>

      <section id="reviews" className="scroll-mt-24 border-t border-line bg-cream py-16">
        <div className="container-luxe grid gap-12 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
              What clients say
            </h2>
            <div className="mt-5 flex items-end gap-4">
              <p className="font-display text-5xl text-espresso">
                {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : "—"}
              </p>
              <div>
                <RatingStars rating={product.ratingAvg} size={16} />
                <p className="mt-1 text-xs text-mocha">
                  from {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
            <div className="mt-8">
              <ReviewForm productId={product.id} />
            </div>
          </div>

          <div className="space-y-6">
            {product.reviews.length === 0 ? (
              <div className="border border-dashed border-line bg-ivory p-8 text-sm text-mocha">
                No reviews yet — be the first to share how this piece wears.
              </div>
            ) : (
              product.reviews.map((review) => (
                <article key={review.id} className="border-b border-line pb-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-espresso">{review.authorName}</p>
                      <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-mocha">
                        {formatDate(review.createdAt)}
                        {review.verifiedPurchase ? " · Verified purchase" : ""}
                      </p>
                    </div>
                    <RatingStars rating={review.rating} size={13} />
                  </div>
                  {review.title ? (
                    <h3 className="mt-3 font-display text-xl text-espresso">{review.title}</h3>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed text-mocha">{review.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="container-luxe py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Complete the look</p>
              <h2 className="mt-2 font-display text-3xl text-espresso sm:text-4xl">
                You may also love
              </h2>
            </div>
            <Link
              href={`/shop/${product.category.slug}`}
              className="border-b border-ink pb-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-espresso hover:border-gold hover:text-gold"
            >
              View {product.category.name}
            </Link>
          </div>
          <ProductGrid products={related.map(toProductCard)} className="mt-8" />
        </section>
      ) : null}

      <JsonLd
        data={[
          productJsonLd({
            name: product.name,
            description: product.subtitle
              ? `${product.subtitle}. ${product.description}`
              : product.description,
            slug: product.slug,
            images: product.images.map((image) => image.url),
            sku: inStockVariant?.sku ?? product.variants[0]?.sku ?? product.slug,
            pricePence: inStockVariant?.pricePence ?? product.basePricePence,
            compareAtPricePence: product.compareAtPricePence,
            inStock: Boolean(inStockVariant),
            ratingAvg: product.ratingAvg,
            ratingCount: product.ratingCount,
            category: product.category.name,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: product.category.name, path: `/shop/${product.category.slug}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
    </>
  );
}


