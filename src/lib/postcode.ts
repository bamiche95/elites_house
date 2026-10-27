import "server-only";

import { formatPostcode, normalizePostcode } from "@/lib/utils";

export type PostcodeLookupResult = {
  postcode: string;
  city: string;
  county: string;
  region: string;
  country: string;
};

type CacheEntry = { value: PostcodeLookupResult | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL = 1000 * 60 * 60 * 24;

const POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

/**
 * UK postcode lookup via postcodes.io (free, no key). The client still lets the
 * shopper type every line manually, and international addresses skip this step.
 */
export async function lookupPostcode(raw: string): Promise<PostcodeLookupResult | null> {
  const clean = normalizePostcode(raw);
  if (!POSTCODE_PATTERN.test(clean)) return null;

  const cached = cache.get(clean);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      cache.set(clean, { value: null, expiresAt: Date.now() + TTL });
      return null;
    }

    const payload = (await response.json()) as {
      result?: {
        postcode?: string;
        admin_district?: string;
        admin_county?: string;
        region?: string;
        country?: string;
      } | null;
    };

    const result = payload.result;
    if (!result) {
      cache.set(clean, { value: null, expiresAt: Date.now() + TTL });
      return null;
    }

    const value: PostcodeLookupResult = {
      postcode: formatPostcode(result.postcode ?? clean),
      city: result.admin_district ?? result.region ?? "",
      county: result.admin_county ?? result.region ?? "",
      region: result.region ?? "",
      country: result.country ?? "England",
    };

    cache.set(clean, { value, expiresAt: Date.now() + TTL });
    return value;
  } catch (error) {
    console.error("[postcode] lookup failed", error);
    return null;
  }
}
