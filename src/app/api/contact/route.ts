import { NextResponse } from "next/server";

import { sendAdminNotification, sendEmail } from "@/lib/email/send";
import {
  emailEyebrow,
  emailHeading,
  emailMetaRows,
  emailPanel,
  emailPanelLabel,
  emailSmallText,
  emailText,
  escapeHtml,
} from "@/lib/email/brand";
import { emailLayout } from "@/lib/email/templates";
import { env } from "@/lib/env";
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
      subject: "We've received your message — The Elites House",
      template: "contact-acknowledgement",
      replyTo: env.contactEmail,
      html: emailLayout({
        title: "We've received your message",
        preheader: "A real person will reply within one working day.",
        content: `
          ${emailEyebrow("Message received")}
          ${emailHeading(`Thank you, ${name.split(" ")[0] || "there"}.`)}
          ${emailText(
            "Thank you for writing to the atelier. We've received your message and will reply within one working day.",
          )}
          ${emailPanel(
            `${emailPanelLabel("Your message")}
             ${emailText(`<strong>${escapeHtml(subject)}</strong>`, {
               margin: "0 0 6px",
               size: 14,
             })}
             ${emailText(escapeHtml(message).replace(/\n/g, "<br />"), {
               margin: "0",
               size: 14,
             })}`,
          )}
        `,
        footerNote: "If your enquiry is urgent, reply to this email and we'll prioritise it.",
      }),
    });

    await sendAdminNotification(
      `Contact form — ${subject}`,
      emailLayout({
        title: "New contact message",
        content: `
          ${emailEyebrow("Contact form")}
          ${emailHeading("New contact message")}
          ${emailMetaRows([
            { label: "Name", value: name },
            { label: "Email", value: email },
            ...(phone ? [{ label: "Phone", value: phone }] : []),
          ])}
          ${emailPanel(
            `${emailPanelLabel("Message")}
             ${emailText(`<strong>${escapeHtml(subject)}</strong>`, {
               margin: "0 0 6px",
               size: 14,
             })}
             ${emailText(escapeHtml(message).replace(/\n/g, "<br />"), {
               margin: "0",
               size: 14,
             })}`,
          )}
          ${emailSmallText("Reply directly to this email to answer the customer.", "0")}
        `,
      }),
      { to: env.contactEmail, replyTo: email.toLowerCase().trim() },
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
