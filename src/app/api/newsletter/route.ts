import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { campaignEmail } from "@/lib/email/templates";
import { env, isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`newsletter:${clientIp(request)}`, 8, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 422 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true, unsubscribedAt: null },
      create: { email, source: parsed.data.source },
    });

    if (isEmailConfigured) {
      const content = campaignEmail({
        subject: "You're on the atelier list",
        bodyHtml: `<p>Hi there,</p><p>Thank you for joining the LushTresses list. Expect one considered email a fortnight: restocks, styling notes and first access to new batches.</p><p>In the meantime, start with our <a href="${env.siteUrl}/hair-care">hair care guide</a>.</p><p>— The atelier</p>`,
        unsubscribeUrl: `${env.siteUrl.replace(/\/$/, "")}/unsubscribe/${subscriber.token}`,
      });
      await sendEmail({
        to: email,
        subject: content.subject,
        html: content.html,
        template: "newsletter-welcome",
      });
    }

    return NextResponse.json({
      message: isEmailConfigured
        ? "Check your inbox — we've sent a little welcome."
        : "You're on the atelier list.",
    });
  } catch (error) {
    console.error("[newsletter]", error);
    return NextResponse.json(
      { error: "We couldn't add you to the list. Please try again." },
      { status: 500 },
    );
  }
}
