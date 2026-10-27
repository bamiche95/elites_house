import { NextResponse } from "next/server";

import { sendAdminNotification, sendEmail } from "@/lib/email/send";
import { emailLayout, escapeHtml } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many messages. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your message." },
      { status: 422 },
    );
  }

  const { name, email, phone, subject, message } = parsed.data;

  try {
    await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "We've received your message — LushTresses",
      template: "contact-acknowledgement",
      html: emailLayout({
        title: "We've received your message",
        preheader: "A real person will reply within one working day.",
        content: `
          <p style="margin:0 0 12px;">Hi ${escapeHtml(name.split(" ")[0] || "there")},</p>
          <p style="margin:0 0 12px;">Thank you for writing to the atelier. We've received your message and will reply within one working day.</p>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6f5544;">Your message</p>
          <p style="margin:0 0 8px;font-weight:bold;">${escapeHtml(subject)}</p>
          <p style="margin:0;">${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
        footerNote: "If your enquiry is urgent, reply to this email and we'll prioritise it.",
      }),
    });

    await sendAdminNotification(
      `Contact form — ${subject}`,
      emailLayout({
        title: "New contact message",
        content: `
          <p style="margin:0 0 8px;"><strong>${escapeHtml(name)}</strong> · ${escapeHtml(email)}${phone ? ` · ${escapeHtml(phone)}` : ""}</p>
          <p style="margin:0 0 8px;font-weight:bold;">${escapeHtml(subject)}</p>
          <p style="margin:0;">${escapeHtml(message).replace(/\n/g, "<br />")}</p>
        `,
      }),
    );

    return NextResponse.json({
      message: "Thank you — your message is with the atelier. We reply within one working day.",
    });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json(
      { error: "We couldn't send your message. Please email us directly." },
      { status: 500 },
    );
  }
}
