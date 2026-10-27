import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { addressFormSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = addressFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the address details." },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const count = await prisma.address.count({ where: { userId: user.id } });
  const makeDefault = data.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        userId: user.id,
        label: data.label?.trim() || null,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        line1: data.line1.trim(),
        line2: data.line2?.trim() || null,
        city: data.city.trim(),
        county: data.county?.trim() || null,
        postcode: data.postcode.trim(),
        country: data.country,
        isDefault: makeDefault,
      },
    });
  });

  return NextResponse.json({ ok: true, id: address.id });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | (Record<string, unknown> & { id?: string })
    | null;
  if (!body?.id) return NextResponse.json({ error: "Missing address." }, { status: 400 });

  const parsed = addressFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the address details." },
      { status: 422 },
    );
  }

  const existing = await prisma.address.findFirst({
    where: { id: body.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    await tx.address.update({
      where: { id: existing.id },
      data: {
        label: data.label?.trim() || null,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        line1: data.line1.trim(),
        line2: data.line2?.trim() || null,
        city: data.city.trim(),
        county: data.county?.trim() || null,
        postcode: data.postcode.trim(),
        country: data.country,
        isDefault: data.isDefault,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing address." }, { status: 400 });

  const deleted = await prisma.address.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Address not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
