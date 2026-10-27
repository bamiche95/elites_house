import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";
import { guestSetupSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`guest-setup:${clientIp(request)}`, 8, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = guestSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 422 },
    );
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.accountSetupToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, passwordHash: true, name: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This link has expired or already been used. Contact us for a new one." },
      { status: 400 },
    );
  }

  if (record.user.passwordHash) {
    await prisma.accountSetupToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return NextResponse.json(
      { error: "This account already has a password. Please sign in." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
        name: parsed.data.name?.trim() || record.user.name,
      },
    }),
    prisma.accountSetupToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, email: record.user.email });
}
