import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { faqJsonLd } from "@/lib/jsonld";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Frequently asked questions",
  description:
    "Answers on lengths, bundle quantities, delivery, returns, payments and caring for 100% Remy human hair.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }],
  });

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  return (
    <>
      <section className="border-b border-line bg-cream py-10 sm:py-14">
        <div className="container-luxe">
          <Breadcrumbs items={[{ label: "FAQs" }]} />
          <p className="eyebrow mt-7">Good to know</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-espresso sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mocha sm:text-base">
            Everything from choosing a length to caring for HD lace. Still stuck? The atelier
            replies within one working day.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-12 py-12 lg:grid-cols-[14rem_1fr] lg:py-16">
        <aside className="h-fit space-y-3">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-mocha">Topics</p>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <a
                  href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-mocha transition-colors hover:text-espresso"
                >
                  {category}
                </a>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-4">
            <ButtonLink href="/contact" variant="outline" size="sm" className="w-full">
              Ask us anything
            </ButtonLink>
          </div>
        </aside>

        <div className="space-y-12">
          {categories.map((category) => (
            <section
              key={category}
              id={category.toLowerCase().replace(/\s+/g, "-")}
              className="scroll-mt-28"
            >
              <h2 className="font-display text-2xl text-espresso">{category}</h2>
              <Accordion
                className="mt-4"
                defaultOpenId={faqs.find((faq) => faq.category === category)?.id}
                items={faqs
                  .filter((faq) => faq.category === category)
                  .map((faq) => ({
                    id: faq.id,
                    title: faq.question,
                    content: <p>{faq.answer}</p>,
                  }))}
              />
            </section>
          ))}

          <div className="border border-line bg-cream p-6">
            <p className="font-display text-2xl text-espresso">Still have a question?</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha">
              Email the atelier or book a free 15-minute consultation and we&apos;ll help you
              choose texture, length and density.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/contact">Contact us</ButtonLink>
              <ButtonLink href="/shop" variant="outline">
                Shop the collection
              </ButtonLink>
            </div>
          </div>

          <p className="text-xs text-mocha">
            Looking for shipping times?{" "}
            <Link href="/shipping" className="underline underline-offset-2">
              Read the delivery page
            </Link>
            .
          </p>
        </div>
      </section>

      <JsonLd
        data={faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))}
      />
    </>
  );
}
