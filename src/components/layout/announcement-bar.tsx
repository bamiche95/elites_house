import Link from "next/link";

import { prisma } from "@/lib/prisma";

const FALLBACK = "Free UK delivery over £150 · Complimentary satin pouch with every order";

export async function AnnouncementBar() {
  let message = FALLBACK;
  let href: string | null = null;

  try {
    const banner = await prisma.banner.findFirst({
      where: {
        placement: "ANNOUNCEMENT",
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }],
      },
      orderBy: { position: "asc" },
      select: { title: true, subtitle: true, ctaHref: true },
    });
    if (banner) {
      message = banner.subtitle ? `${banner.title} — ${banner.subtitle}` : banner.title;
      href = banner.ctaHref;
    }
  } catch {
    // The storefront still renders if the database is briefly unavailable.
  }

  return (
    <div className="bg-ink text-ivory">
      <div className="container-luxe flex h-9 items-center justify-center text-center">
        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ivory/90">
          {href ? (
            <Link href={href} className="transition-colors hover:text-gold-soft">
              {message}
            </Link>
          ) : (
            message
          )}
        </p>
      </div>
    </div>
  );
}
