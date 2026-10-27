import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`register:${clientIp(request)}`, 6, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 422 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      );
    }

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: existing.name ?? parsed.data.name.trim(),
            passwordHash,
            emailVerified: new Date(),
            marketingOptIn: parsed.data.marketingOptIn,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name: parsed.data.name.trim(),
            passwordHash,
            emailVerified: new Date(),
            marketingOptIn: parsed.data.marketingOptIn,
            role: "CUSTOMER",
          },
        });

    if (parsed.data.marketingOptIn) {
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { isActive: true, unsubscribedAt: null },
        create: { email, source: "registration" },
      });
    }

    const content = welcomeEmail({
      name: user.name,
      unsubscribeUrl: `${env.siteUrl.replace(/\/$/, "")}/unsubscribe/${user.unsubscribeToken}`,
    });

    await sendEmail({
      to: user.email,
      subject: content.subject,
      html: content.html,
      template: "welcome",
      userId: user.id,
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "We couldn't create your account. Please try again." },
      { status: 500 },
    );
  }
}
