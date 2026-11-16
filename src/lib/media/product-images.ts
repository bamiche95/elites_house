/**
 * Pure helpers for the product image editor.
 *
 * Kept free of Prisma/Next imports so the diffing logic can be exercised in a
 * script (`scripts/media-check.mjs` drives the store; this part is unit-testable).
 */

export const MAX_PRODUCT_IMAGES = 10;
const MAX_URL_LENGTH = 500;
const MAX_ALT_LENGTH = 160;

export type DesiredImage = { id?: string; url: string; alt?: string };
export type PlannedCreate = { url: string; alt: string; position: number };
export type PlannedUpdate = { id: string; alt: string; position: number };
export type PlannedRemove = { id: string; url: string };

export type ImageChangePlan = {
  create: PlannedCreate[];
  update: PlannedUpdate[];
  remove: PlannedRemove[];
};

/** Accepts storefront-relative paths and absolute HTTPS URLs only. */
export function isAllowedImageUrl(url: string) {
  const value = url.trim();
  return value.startsWith("/") || value.startsWith("https://");
}

export function normalizeAlt(alt: string | undefined, fallback: string) {
  const value = (alt ?? "").trim();
  return (value || fallback).slice(0, MAX_ALT_LENGTH);
}

/**
 * Reads what the admin form submitted: either a JSON array of
 * `{ url, alt }` objects (the uploader) or a newline-separated list of URLs.
 * Invalid, duplicate and over-limit entries are dropped rather than rejected so
 * a single bad paste cannot lose the rest of the selection.
 */
export function parseImageList(raw: string | null | undefined): DesiredImage[] {
  const value = (raw ?? "").trim();
  if (!value) return [];

  let entries: unknown[];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return [];
      entries = parsed;
    } catch {
      return [];
    }
  } else {
    entries = value.split(/\r?\n/);
  }

  const images: DesiredImage[] = [];

  for (const entry of entries) {
    const candidate =
      typeof entry === "string" ? { url: entry } : (entry as { url?: unknown; alt?: unknown });
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";

    if (!url || url.length > MAX_URL_LENGTH || !isAllowedImageUrl(url)) continue;
    if (images.some((image) => image.url === url)) continue;

    images.push({ url, alt: typeof candidate.alt === "string" ? candidate.alt : undefined });
    if (images.length >= MAX_PRODUCT_IMAGES) break;
  }

  return images;
}

/**
 * Diffs the images the admin submitted against the rows in the database.
 * Order in `desired` becomes `position`, so index 0 is the primary image used by
 * product cards, the cart and order emails.
 *
 * Entries without an `id` fall back to a URL match first: the manager uploads a
 * file and only learns its row id after the next page load, so matching on URL
 * stops a later reorder from deleting (and un-storing) a freshly added image.
 */
export function planImageChanges(
  existing: { id: string; url: string }[],
  desired: DesiredImage[],
  fallbackAlt: string,
): ImageChangePlan {
  const byId = new Map(existing.map((image) => [image.id, image]));
  const byUrl = new Map(existing.map((image) => [image.url, image]));
  const create: PlannedCreate[] = [];
  const update: PlannedUpdate[] = [];
  const kept = new Set<string>();

  desired.slice(0, MAX_PRODUCT_IMAGES).forEach((image, position) => {
    const alt = normalizeAlt(image.alt, fallbackAlt);
    let current = image.id ? byId.get(image.id) : undefined;

    if (!current || kept.has(current.id)) {
      const match = byUrl.get(image.url);
      if (match && !kept.has(match.id)) {
        current = match;
        byUrl.delete(image.url);
      } else {
        current = undefined;
      }
    }

    if (current) {
      kept.add(current.id);
      update.push({ id: current.id, alt, position });
    } else {
      create.push({ url: image.url, alt, position });
    }
  });

  return {
    create,
    update,
    remove: existing.filter((image) => !kept.has(image.id)),
  };
}
