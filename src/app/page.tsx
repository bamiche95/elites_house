import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/price";
import { activeBannerWhere } from "@/lib/banners";
import { HAIR_CARE_STEPS } from "@/lib/constants";
import { faqJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { prisma } from "@/lib/prisma";
import { productCardInclude, toProductCard } from "@/lib/product-view";
import { defaultMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = defaultMetadata;

export default async function HomePage() {
  const [hero, promo, categories, bestSellers, featured, testimonials, faqs] =
    await Promise.all([
      prisma.banner.findFirst({
        where: activeBannerWhere("HOME_HERO"),
        orderBy: { position: "asc" },
      }),
      prisma.banner.findFirst({
        where: activeBannerWhere("HOME_PROMO"),
        orderBy: { position: "asc" },
      }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
      prisma.product.findMany({
        where: { isActive: true, isBestSeller: true },
        include: productCardInclude,
        orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: productCardInclude,
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { position: "asc" },
        take: 3,
      }),
      prisma.faq.findMany({ where: { isActive: true }, orderBy: { position: "asc" }, take: 5 }),
    ]);

  const bestSellerCards = bestSellers.map(toProductCard);
  const featuredCards = featured.map(toProductCard);

  return (
    <>
      <section className="relative overflow-hidden bg-ivory">
        <div className="container-luxe grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow">{hero?.badge ?? "The Autumn Edit"}</p>
            <h1 className="mt-4 font-display text-[2.7rem] leading-[1.04] text-espresso sm:text-6xl lg:text-[4.1rem]">
              Hair that behaves{" "}
              <span className="italic text-gold">like your own.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-mocha sm:text-base">
              {hero?.body ??
                "Cuticle-aligned, double-drawn and true to length. Six signature textures, one uncompromising standard."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={hero?.ctaHref ?? "/shop"} size="lg">
                {hero?.ctaLabel ?? "Shop the collection"}
              </ButtonLink>
              <ButtonLink href="/shop/bundles" variant="outline" size="lg">
                Shop bundles
              </ButtonLink>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <RatingStars rating={5} size={14} />
              <p className="text-xs text-mocha">
                Loved by 4,000+ clients · 4.9 average from verified reviews
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream sm:aspect-[5/6]">
              <Image
                src={hero?.imageUrl ?? "/images/hero.jpg"}
                alt="LushTresses luxury human hair styled in soft waves"
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 left-4 hidden max-w-[16rem] border border-line bg-ivory p-5 shadow-card sm:block">
              <p className="eyebrow">Atelier note</p>
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                Every bundle is hand-weighed, cuticle-aligned and steamed in our London studio.
              </p>
            </div>
            <div className="absolute -right-3 top-8 hidden rotate-90 text-[0.55rem] uppercase tracking-[0.4em] text-mocha/60 lg:block">
              Est. 2016 — London
            </div>
          </div>
        </div>
      </section>

      <TrustBadges className="mt-4" />

      <section className="py-20">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Shop by category"
            title="Find your texture"
            description="Bundles for a full install, glueless wigs for effortless mornings, and closures or frontals for a flawless finish."
            action={{ label: "View all", href: "/shop" }}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className={cn(
                  "group relative overflow-hidden bg-cream",
                  index === 0
                    ? "aspect-[4/5] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[34rem]"
                    : "aspect-[4/5]",
                )}
              >
                <Image
                  src={category.imageUrl ?? "/images/collection-bundles.jpg"}
                  alt={category.name}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 640px) 92vw, 48vw"
                      : "(max-width: 640px) 92vw, 24vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                  <p className="text-[0.58rem] uppercase tracking-[0.26em] text-gold-soft">
                    {category.tagline}
                  </p>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl">{category.name}</h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.18em]">
                    Explore{" "}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Best sellers"
            title="The ones that keep selling out"
            description="Restocked in small batches. When they're gone, they're gone until the next lot clears quality control."
            action={{ label: "Shop all", href: "/shop" }}
          />
          <ProductGrid products={bestSellerCards} className="mt-10" />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Atelier picks"
            title="New & noteworthy"
            description="Hand-selected by our team for texture, density and longevity."
            action={{ label: "New arrivals", href: "/shop?sort=newest" }}
          />
          <ProductGrid products={featuredCards} className="mt-10" />
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="container-luxe grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden bg-sand">
            <Image
              src="/images/about-atelier.jpg"
              alt="Inside the LushTresses atelier in London"
              fill
              sizes="(max-width: 1024px) 92vw, 46vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">The atelier standard</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-espresso sm:text-4xl">
              Small batches. Hand-finished. Never rushed.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mocha">
              We buy in small lots and turn most of them away. Each bundle is checked for
              cuticle alignment, weighed to the gram and steamed by hand. If it doesn&apos;t pass,
              it doesn&apos;t ship.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Cuticle-aligned, double-drawn 100% Remy hair",
                "Hand-plucked hairlines and bleached knots",
                "12–18 month lifespan with a simple weekly routine",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-mocha">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ButtonLink href="/about" variant="outline" className="mt-8">
              Read our story
            </ButtonLink>
          </div>
        </div>
      </section>

      {promo ? (
        <section className="relative isolate overflow-hidden bg-ink text-ivory">
          <Image
            src={promo.imageUrl ?? "/images/promo.jpg"}
            alt=""
            fill
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover opacity-40"
          />
          <div className="container-luxe grid items-center gap-8 py-20 lg:grid-cols-2">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-gold-soft">
                {promo.badge ?? "Bundle offer"}
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                {promo.title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/80">
                {promo.body ?? promo.subtitle}
              </p>
              <ButtonLink
                href={promo.ctaHref ?? "/shop"}
                variant="gold"
                size="lg"
                className="mt-8"
              >
                {promo.ctaLabel ?? "Shop now"}
              </ButtonLink>
            </div>
            <div className="lg:justify-self-end lg:text-right">
              <p className="font-display text-6xl text-gold-soft/90">22%</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ivory/70">
                saved vs buying separately
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <Testimonials items={testimonials} />

      <section className="py-20">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Hair care"
            title="Make it last"
            description="Four habits that separate hair that lasts a year from hair that lasts a season."
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HAIR_CARE_STEPS.map((step) => (
              <div key={step.step} className="border-t border-ink pt-5">
                <p className="font-display text-3xl text-gold">{step.step}</p>
                <h3 className="mt-2 font-display text-xl text-espresso">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mocha">{step.copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/hair-care" variant="outline">
              Read the full guide
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-luxe grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Good to know</p>
            <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
              Questions, answered.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-mocha">
              Can&apos;t find what you need? Our team replies within one working day.
            </p>
            <ButtonLink href="/faq" variant="outline" className="mt-6">
              All FAQs
            </ButtonLink>
          </div>
          <Accordion
            items={faqs.map((faq) => ({
              id: faq.id,
              title: faq.question,
              content: <p>{faq.answer}</p>,
            }))}
          />
        </div>
      </section>

      <JsonLd
        data={[
          itemListJsonLd(
            bestSellers.map((product) => ({
              name: product.name,
              path: `/product/${product.slug}`,
            })),
          ),
          faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))),
        ]}
      />
    </>
  );
}


