import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { passwordChangeSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const limit = rateLimit(`password:${user.id}:${clientIp(request)}`, 6, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your password." },
      { status: 422 },
    );
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (record.passwordHash) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ error: "Enter your current password." }, { status: 422 });
    }
    const valid = await compare(parsed.data.currentPassword, record.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.password, 12), emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
