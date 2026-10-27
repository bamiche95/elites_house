import type { BannerPlacement, Prisma } from "@prisma/client";

/** Banners honour their optional scheduling window. */
export function activeBannerWhere(placement: BannerPlacement): Prisma.BannerWhereInput {
  const now = new Date();
  return {
    placement,
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}
