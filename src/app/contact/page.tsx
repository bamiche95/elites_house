import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactForm } from "@/components/marketing/contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/constants";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact the atelier",
  description:
    "Questions about sizing, textures, installs or an order? Message the LushTresses atelier — we reply within one working day.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line bg-cream py-10 sm:py-14">
        <div className="container-luxe">
          <Breadcrumbs items={[{ label: "Contact" }]} />
          <p className="eyebrow mt-7">We&apos;re here</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-espresso sm:text-5xl">
            Talk to the atelier
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mocha sm:text-base">
            Sizing, texture matching, installs or an existing order — a real person replies
            within one working day, Monday to Friday.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-12 py-12 lg:grid-cols-[1.3fr_1fr] lg:py-16">
        <div>
          <h2 className="font-display text-2xl text-espresso">Send a message</h2>
          <p className="mt-1 text-sm text-mocha">
            Prefer email? Write to{" "}
            <a href={`mailto:${siteConfig.supportEmail}`} className="underline underline-offset-2">
              {siteConfig.supportEmail}
            </a>
            .
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <aside className="h-fit space-y-6 border border-line bg-cream p-6">
          <div>
            <p className="eyebrow">The studio</p>
            <p className="mt-2 font-display text-2xl text-espresso">
              Visits by appointment
            </p>
          </div>

          <ul className="space-y-4 text-sm text-mocha">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>
                {siteConfig.addressLine}
                <br />
                {siteConfig.city} {siteConfig.postcode}
                <br />
                {siteConfig.country}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-espresso">
                {siteConfig.supportEmail}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a
                href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
                className="hover:text-espresso"
              >
                {siteConfig.supportPhone}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{siteConfig.hours}</span>
            </li>
          </ul>

          <div className="border-t border-line pt-4">
            <p className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
              Order enquiries
            </p>
            <p className="mt-2 text-xs leading-relaxed text-mocha">
              Include your order number (starts with LT-) so we can help faster. For returns,
              tell us whether the hair is still sealed.
            </p>
          </div>
        </aside>
      </section>

      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
    </>
  );
}
