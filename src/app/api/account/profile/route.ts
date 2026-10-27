import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your details." },
      { status: 422 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone?.trim() || null,
      marketingOptIn: parsed.data.marketingOptIn,
    },
    select: { name: true, phone: true, marketingOptIn: true },
  });

  if (parsed.data.marketingOptIn) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: user.email },
      update: { isActive: true, unsubscribedAt: null },
      create: { email: user.email, source: "account" },
    });
  } else {
    await prisma.newsletterSubscriber.updateMany({
      where: { email: user.email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, profile: updated });
}
