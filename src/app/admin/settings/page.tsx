import type { Metadata } from "next";
import Link from "next/link";

import { saveStoreContactAction } from "@/app/admin/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { prisma } from "@/lib/prisma";
import { STORE_SETTINGS_KEY, mergeStoreContact } from "@/lib/store-settings";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;

  const setting = await prisma.setting.findUnique({
    where: { key: STORE_SETTINGS_KEY },
    select: { value: true, updatedAt: true },
  });
  const contact = mergeStoreContact(setting?.value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-espresso">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-mocha">
          The atelier address, phone and email shown in the site footer and on the contact page,
          printed on every order email, and published in the organisation details search engines read.
        </p>
      </div>

      {params.saved ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Saved — the storefront, emails and structured data now use these details.
        </p>
      ) : null}
      {params.error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {params.error}
        </p>
      ) : null}

      <form action={saveStoreContactAction} className="space-y-6">
        <section className="border border-line bg-cream p-5 sm:p-6">
          <h2 className="font-display text-xl text-espresso">Contact details</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mocha">
            The support address receives contact-form replies; the order address appears on the
            product pages for returns. Changes go live everywhere as soon as you save.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label="Support email"
              htmlFor="supportEmail"
              hint="Shown in the footer and on the contact page."
            >
              <Input
                id="supportEmail"
                name="supportEmail"
                type="email"
                required
                autoComplete="email"
                defaultValue={contact.supportEmail}
              />
            </Field>
            <Field
              label="Order enquiries email"
              htmlFor="ordersEmail"
              hint="Used on product pages for returns and exchanges."
            >
              <Input
                id="ordersEmail"
                name="ordersEmail"
                type="email"
                required
                autoComplete="off"
                defaultValue={contact.ordersEmail}
              />
            </Field>
            <Field label="Phone" htmlFor="supportPhone" hint="Include the country code, e.g. +44.">
              <Input
                id="supportPhone"
                name="supportPhone"
                type="tel"
                required
                autoComplete="tel"
                defaultValue={contact.supportPhone}
              />
            </Field>
            <Field
              label="Instagram URL"
              htmlFor="instagram"
              hint="Leave blank to hide the social link in emails and structured data."
            >
              <Input
                id="instagram"
                name="instagram"
                type="url"
                autoComplete="off"
                placeholder="https://instagram.com/…"
                defaultValue={contact.instagram}
              />
            </Field>
          </div>
        </section>

        <section className="border border-line bg-cream p-5 sm:p-6">
          <h2 className="font-display text-xl text-espresso">Atelier address</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mocha">
            Printed in the footer and on the contact page, and published as the organisation&apos;s
            postal address in structured data.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Address line 1" htmlFor="addressLine" className="sm:col-span-2">
              <Input
                id="addressLine"
                name="addressLine"
                required
                autoComplete="address-line1"
                defaultValue={contact.addressLine}
              />
            </Field>
            <Field
              label="Address line 2"
              htmlFor="addressLine2"
              hint="Optional — studio, unit or building name."
              className="sm:col-span-2"
            >
              <Input
                id="addressLine2"
                name="addressLine2"
                autoComplete="address-line2"
                defaultValue={contact.addressLine2}
              />
            </Field>
            <Field label="Town or city" htmlFor="city">
              <Input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={contact.city}
              />
            </Field>
            <Field label="Postcode" htmlFor="postcode">
              <Input
                id="postcode"
                name="postcode"
                required
                autoComplete="postal-code"
                defaultValue={contact.postcode}
              />
            </Field>
            <Field label="Country" htmlFor="country">
              <Input
                id="country"
                name="country"
                required
                autoComplete="country-name"
                defaultValue={contact.country}
              />
            </Field>
            <Field
              label="Country code"
              htmlFor="countryCode"
              hint="Two letters, used in structured data (GB, US, IE…)."
            >
              <Input
                id="countryCode"
                name="countryCode"
                required
                maxLength={2}
                autoComplete="off"
                defaultValue={contact.countryCode}
              />
            </Field>
          </div>
        </section>

        <section className="border border-line bg-cream p-5 sm:p-6">
          <h2 className="font-display text-xl text-espresso">Opening hours</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mocha">
            Shown next to the address in the footer and on the contact page.
          </p>
          <div className="mt-5">
            <Field label="Hours" htmlFor="hours">
              <Input
                id="hours"
                name="hours"
                required
                autoComplete="off"
                defaultValue={contact.hours}
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">Save changes</Button>
          <Link
            href="/contact"
            className="text-[0.66rem] uppercase tracking-[0.16em] text-mocha underline underline-offset-4 hover:text-espresso"
          >
            View contact page
          </Link>
          <p className="text-xs text-mocha">
            {setting
              ? `Last saved ${formatDateTime(setting.updatedAt)}.`
              : "Using the defaults from your environment variables until you save."}
          </p>
        </div>
      </form>
    </div>
  );
}
