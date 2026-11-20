import "server-only";

import { siteConfig } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/** Key of the `Setting` row holding the atelier's address and contact details. */
export const STORE_SETTINGS_KEY = "store";

export type StoreContact = {
  supportEmail: string;
  ordersEmail: string;
  supportPhone: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  countryCode: string;
  hours: string;
  instagram: string;
};

/** Values used until an admin saves the form in **Admin → Settings**. */
export const defaultStoreContact: StoreContact = {
  supportEmail: siteConfig.supportEmail,
  ordersEmail: siteConfig.ordersEmail,
  supportPhone: siteConfig.supportPhone,
  addressLine: siteConfig.addressLine,
  addressLine2: "",
  city: siteConfig.city,
  postcode: siteConfig.postcode,
  country: siteConfig.country,
  countryCode: "GB",
  hours: siteConfig.hours,
  instagram: siteConfig.instagram,
};

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Optional lines keep a blank string so an admin can remove them; a missing key inherits the default. */
function optionalText(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

/** Merges the stored JSON with the environment defaults, ignoring anything malformed. */
export function mergeStoreContact(value: unknown): StoreContact {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    supportEmail: text(record.supportEmail, defaultStoreContact.supportEmail),
    ordersEmail: text(record.ordersEmail, defaultStoreContact.ordersEmail),
    supportPhone: text(record.supportPhone, defaultStoreContact.supportPhone),
    addressLine: text(record.addressLine, defaultStoreContact.addressLine),
    addressLine2: optionalText(record.addressLine2, defaultStoreContact.addressLine2),
    city: text(record.city, defaultStoreContact.city),
    postcode: text(record.postcode, defaultStoreContact.postcode),
    country: text(record.country, defaultStoreContact.country),
    countryCode: text(record.countryCode, defaultStoreContact.countryCode).toUpperCase(),
    hours: text(record.hours, defaultStoreContact.hours),
    instagram: optionalText(record.instagram, defaultStoreContact.instagram),
  };
}

/** Address and contact details used by the footer, the contact page, emails and JSON-LD. */
export async function getStoreContact(): Promise<StoreContact> {
  const setting = await prisma.setting.findUnique({
    where: { key: STORE_SETTINGS_KEY },
    select: { value: true },
  });

  return mergeStoreContact(setting?.value);
}

/** Address lines ready to render, with blank optional lines dropped. */
export function storeAddressLines(contact: StoreContact) {
  return [
    contact.addressLine,
    contact.addressLine2,
    [contact.city, contact.postcode].filter(Boolean).join(" "),
    contact.country,
  ].filter((line) => line.trim().length > 0);
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
