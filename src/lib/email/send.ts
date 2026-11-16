import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

import { emailTransport, env, isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  template?: string;
  campaignId?: string;
  userId?: string;
  /** Overrides `EMAIL_FROM`, e.g. the support address for contact replies. */
  from?: string;
  /** Where the recipient's reply should land. */
  replyTo?: string;
};

export type SendEmailResult = {
  status: "SENT" | "FAILED" | "SKIPPED";
  provider: string;
  id?: string;
  error?: string;
};

/**
 * Provider-agnostic transactional email. Never throws: failures are recorded in
 * EmailLog and surfaced to the caller so checkout is never blocked by email.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = emailTransport;

  if (!isEmailConfigured) {
    await logEmail(input, { status: "SKIPPED", provider: "none" });
    return { status: "SKIPPED", provider: "none" };
  }

  try {
    let id: string | undefined;
    if (provider === "sendgrid") {
      id = await sendWithSendGrid(input);
    } else if (provider === "smtp") {
      id = await sendWithSmtp(input);
    } else {
      id = await sendWithResend(input);
    }
    await logEmail(input, { status: "SENT", provider, id });
    return { status: "SENT", provider, id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error(`[email] ${provider} send failed:`, message);
    await logEmail(input, { status: "FAILED", provider, error: message });
    return { status: "FAILED", provider, error: message };
  }
}

async function sendWithResend(input: SendEmailInput) {
  const resend = new Resend(env.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: input.from ?? env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });
  if (error) throw new Error(error.message);
  return data?.id;
}

let smtpTransport: Transporter | null = null;

function getSmtpTransport() {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }
  return smtpTransport;
}

/**
 * Sends through the hosting provider's mailbox (cPanel/Exim style). The envelope
 * sender is the `From` address, so `SMTP_USER` must own it or be allowed to send
 * as it — see the `email:check` script to verify a mailbox before going live.
 */
async function sendWithSmtp(input: SendEmailInput) {
  const info = await getSmtpTransport().sendMail({
    from: input.from ?? env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  const rejected = info.rejected ?? [];
  if (rejected.length > 0) {
    throw new Error(`SMTP rejected recipient(s): ${rejected.join(", ")}`);
  }
  return info.messageId;
}

async function sendWithSendGrid(input: SendEmailInput) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.sendgridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to }] }],
      from: parseFrom(input.from ?? env.emailFrom),
      ...(input.replyTo ? { reply_to: parseFrom(input.replyTo) } : {}),
      subject: input.subject,
      content: [{ type: "text/html", value: input.html }],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid responded ${response.status}`);
  }
  return response.headers.get("x-message-id") ?? undefined;
}

function parseFrom(value: string) {
  const match = value.match(/^(.*)<(.+)>$/);
  if (!match) return { email: value.trim() };
  return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
}

async function logEmail(input: SendEmailInput, result: SendEmailResult) {
  try {
    await prisma.emailLog.create({
      data: {
        to: input.to,
        subject: input.subject,
        template: input.template,
        provider: result.provider,
        status: result.status,
        error: result.error,
        campaignId: input.campaignId,
        userId: input.userId,
      },
    });
  } catch (error) {
    console.error("[email] could not write EmailLog", error);
  }
}

export type AdminNotificationOptions = { to?: string; replyTo?: string; from?: string };

/**
 * Notifies a store inbox (best-effort). Defaults to `ADMIN_NOTIFICATION_EMAIL`
 * (orders@) — contact-form traffic passes the support inbox instead.
 */
export async function sendAdminNotification(
  subject: string,
  html: string,
  options: AdminNotificationOptions = {},
) {
  const to = options.to ?? env.adminEmail;
  if (!to) return;
  await sendEmail({
    to,
    subject,
    html,
    template: "admin-notification",
    from: options.from,
    replyTo: options.replyTo,
  });
}
