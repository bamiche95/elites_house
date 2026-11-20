import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { footerNav, siteConfig } from "@/lib/constants";
import { telHref, type StoreContact } from "@/lib/store-settings";

const columns = [
  { title: "Shop", links: footerNav.shop },
  { title: "Help", links: footerNav.help },
  { title: "Atelier", links: footerNav.company },
];

export function SiteFooter({ contact }: { contact: StoreContact }) {
  return (
    <footer className="mt-24 border-t border-line bg-cream">
      <div className="container-luxe py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="font-display text-2xl uppercase tracking-[0.24em] text-espresso">
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mocha">
             No. 1 luxury hair, haircare and hair accessories destination. We are a team of hair enthusiasts, stylists and product experts who are passionate about helping you achieve your best hair yet.
            </p>

            <div className="mt-6 space-y-2 text-sm text-mocha">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  {contact.addressLine}
                  {contact.addressLine2 ? `, ${contact.addressLine2}` : ""}
                  <br />
                  {contact.city} {contact.postcode}, {contact.country}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                <a href={`mailto:${contact.supportEmail}`} className="hover:text-espresso">
                  {contact.supportEmail}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                <a href={telHref(contact.supportPhone)} className="hover:text-espresso">
                  {contact.supportPhone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                <span>{contact.hours}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-espresso">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-mocha transition-colors hover:text-espresso"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">The Atelier Letter</p>
            <h2 className="mt-2 font-display text-3xl text-espresso">
              Restocks, styling notes &amp; early access.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-mocha">
              One considered email a fortnight. No noise — just the good stuff.
            </p>
          </div>
          <NewsletterForm source="footer" />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-8 text-xs text-mocha sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-espresso">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-espresso">
              Terms
            </Link>
            <Link href="/returns" className="hover:text-espresso">
              Returns
            </Link>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span>Visa · Mastercard · Amex · Apple Pay · PayPal · Klarna</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
