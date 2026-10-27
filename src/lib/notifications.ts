import "server-only";

import { siteConfig } from "@/lib/constants";
import { sendAdminNotification, sendEmail } from "@/lib/email/send";
import {
  adminOrderEmail,
  guestSetupReminderEmail,
  orderConfirmationEmail,
  orderStatusEmail,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken, hoursFromNow } from "@/lib/tokens";

function unsubscribeUrl(token?: string | null) {
  if (!token) return undefined;
  return `${siteConfig.url.replace(/\/$/, "")}/unsubscribe/${token}`;
}

/** Issues a 48-hour password-setup link for a guest buyer. */
export async function createSetupLink(userId: string) {
  const token = generateToken(32);
  await prisma.accountSetupToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      purpose: "GUEST_ACCOUNT",
      expiresAt: hoursFromNow(48),
    },
  });
  return `${siteConfig.url.replace(/\/$/, "")}/guest-setup/${token}`;
}

export async function notifyOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) return;

  let setupUrl: string | undefined;
  if (order.user && !order.user.passwordHash) {
    setupUrl = await createSetupLink(order.user.id);
  }

  const { subject, html } = orderConfirmationEmail({
    order,
    setupUrl,
    unsubscribeUrl: unsubscribeUrl(order.user?.unsubscribeToken),
  });

  await sendEmail({
    to: order.customerEmail,
    subject,
    html,
    template: "order-confirmation",
    userId: order.userId ?? undefined,
  });

  const admin = adminOrderEmail({ order });
  await sendAdminNotification(admin.subject, admin.html);
}

export async function notifyOrderStatus(orderId: string, status: string, note?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) return;

  const { subject, html } = orderStatusEmail({
    order,
    status,
    note,
    unsubscribeUrl: unsubscribeUrl(order.user?.unsubscribeToken),
  });

  await sendEmail({
    to: order.customerEmail,
    subject,
    html,
    template: `order-${status.toLowerCase()}`,
    userId: order.userId ?? undefined,
  });
}

export async function notifyGuestSetup(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const setupUrl = await createSetupLink(user.id);
  const { subject, html } = guestSetupReminderEmail({ name: user.name, setupUrl });
  await sendEmail({
    to: user.email,
    subject,
    html,
    template: "guest-setup",
    userId: user.id,
  });
}
