import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: { select: { name: true } },
    },
    orderBy: [{ isBestSeller: "desc" }, { ratingAvg: "desc" }],
    take: 6,
  });

  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      pricePence: product.basePricePence,
      imageUrl: product.images[0]?.url ?? null,
      category: product.category.name,
    })),
  });
}
