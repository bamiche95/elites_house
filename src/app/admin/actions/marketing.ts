"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/email/send";
import { campaignEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { formBool, formOptional, formString } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { campaignSchema, emailTemplateSchema } from "@/lib/validators";

function backTo(tab: string, params: Record<string, string> = { saved: "1" }): never {
  const query = new URLSearchParams({ tab, ...params });
  redirect(`/admin/emails?${query.toString()}`);
}

export async function saveEmailTemplateAction(formData: FormData) {
  await requireAdmin();

  const parsed = emailTemplateSchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    description: formOptional(formData, "description"),
    subject: formString(formData, "subject"),
    preheader: formOptional(formData, "preheader"),
    bodyHtml: formString(formData, "bodyHtml"),
    isActive: formBool(formData, "isActive"),
  });

  if (!parsed.success) {
    backTo("templates", { error: parsed.error.issues[0]?.message ?? "Check the template." });
  }

  await prisma.emailTemplate.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader ?? null,
      bodyHtml: parsed.data.bodyHtml,
      isActive: parsed.data.isActive,
    },
  });

  backTo("templates");
}

export async function sendCampaignAction(formData: FormData) {
  await requireAdmin();

  const parsed = campaignSchema.safeParse({
    name: formString(formData, "name"),
    subject: formString(formData, "subject"),
    bodyHtml: formString(formData, "bodyHtml"),
    audience: formString(formData, "audience") || "ALL_CUSTOMERS",
  });

  if (!parsed.success) {
    backTo("campaigns", {
      error: parsed.error.issues[0]?.message ?? "Check your campaign.",
    });
  }

  const recipients = new Map<string, string>();

  if (parsed.data.audience === "NEWSLETTER") {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, token: true },
      take: 200,
    });
    for (const subscriber of subscribers) {
      recipients.set(
        subscriber.email,
        `${env.siteUrl.replace(/\/$/, "")}/unsubscribe/${subscriber.token}`,
      );
    }
  } else {
    const users = await prisma.user.findMany({
      where: {
        marketingOptIn: true,
        ...(parsed.data.audience === "ACCOUNT_HOLDERS" ? { passwordHash: { not: null } } : {}),
      },
      select: { email: true, unsubscribeToken: true },
      take: 200,
    });
    for (const user of users) {
      recipients.set(
        user.email,
        `${env.siteUrl.replace(/\/$/, "")}/unsubscribe/${user.unsubscribeToken}`,
      );
    }
  }

  if (recipients.size === 0) {
    backTo("campaigns", { error: "No opted-in recipients in that audience yet." });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      audience: parsed.data.audience,
      status: "SENDING",
    },
  });

  let sent = 0;
  let failed = 0;

  for (const [email, unsubscribeUrl] of recipients) {
    const content = campaignEmail({
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      unsubscribeUrl,
    });

    const result = await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      template: "campaign",
      campaignId: campaign.id,
    });

    if (result.status === "FAILED") failed += 1;
    else sent += 1;
  }

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: failed === recipients.size ? "FAILED" : "SENT",
      recipientCount: sent,
      failureCount: failed,
      sentAt: new Date(),
    },
  });

  revalidatePath("/admin/emails");
  backTo("campaigns", {
    sent: String(sent),
    ...(failed ? { failed: String(failed) } : {}),
  });
}
