import "server-only";

import { Resend } from "resend";

import { env, isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  template?: string;
  campaignId?: string;
  userId?: string;
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
  const provider = env.emailProvider === "sendgrid" ? "sendgrid" : "resend";

  if (!isEmailConfigured) {
    await logEmail(input, { status: "SKIPPED", provider: "none" });
    return { status: "SKIPPED", provider: "none" };
  }

  try {
    let id: string | undefined;
    if (provider === "sendgrid") {
      id = await sendWithSendGrid(input);
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
    from: env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) throw new Error(error.message);
  return data?.id;
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
      from: parseFrom(env.emailFrom),
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

/** Notifies the atelier inbox (best-effort). */
export async function sendAdminNotification(subject: string, html: string) {
  if (!env.adminEmail) return;
  await sendEmail({ to: env.adminEmail, subject, html, template: "admin-notification" });
}
