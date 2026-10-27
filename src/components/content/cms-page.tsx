import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { renderMarkdown } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export async function cmsMetadata(slug: string): Promise<Metadata> {
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true, metaTitle: true, metaDescription: true, heroImage: true },
  });

  if (!page) {
    return buildMetadata({ title: "Page not found", path: `/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? page.excerpt ?? undefined,
    path: `/${slug}`,
    image: page.heroImage ?? undefined,
  });
}

export async function CmsPageView({
  slug,
  children,
}: {
  slug: string;
  children?: React.ReactNode;
}) {
  const page = await prisma.page.findFirst({ where: { slug, published: true } });
  if (!page) notFound();

  return (
    <>
      <section className="border-b border-line bg-cream py-10 sm:py-14">
        <div className="container-luxe">
          <Breadcrumbs items={[{ label: page.title }]} />
          <p className="eyebrow mt-7">The atelier</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-espresso sm:text-5xl">
            {page.title}
          </h1>
          {page.excerpt ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mocha sm:text-base">
              {page.excerpt}
            </p>
          ) : null}
        </div>
      </section>

      {page.heroImage ? (
        <div className="container-luxe mt-10">
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-cream">
            <Image
              src={page.heroImage}
              alt={page.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <section className="container-luxe py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_0.9fr]">
          <article
            className="prose-luxe max-w-3xl"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
          />

          <aside className="h-fit space-y-5 border border-line bg-cream p-6">
            <div>
              <p className="eyebrow">Need a hand?</p>
              <p className="mt-2 font-display text-2xl text-espresso">
                A real person replies within one working day.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-mocha">
              Message the atelier about sizing, textures, installs or an existing order —
              we&apos;re happy to help.
            </p>
            <div className="grid gap-2">
              <ButtonLink href="/contact" className="w-full">
                Contact us
              </ButtonLink>
              <ButtonLink href="/faq" variant="outline" className="w-full">
                Read the FAQs
              </ButtonLink>
            </div>
            {children}
          </aside>
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: page.title, path: `/${page.slug}` },
        ])}
      />
    </>
  );
}
