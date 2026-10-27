import "server-only";

import type { Order, OrderItem } from "@prisma/client";

import { siteConfig } from "@/lib/constants";
import { formatMoneyExact } from "@/lib/utils";

export type EmailOrder = Order & { items: OrderItem[] };
export type EmailContent = { subject: string; html: string };

const BRAND = siteConfig.name;
const SITE = siteConfig.url.replace(/\/$/, "");

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type LayoutOptions = {
  title: string;
  preheader?: string;
  content: string;
  footerNote?: string;
  unsubscribeUrl?: string;
};

export function emailLayout({
  title,
  preheader,
  content,
  footerNote,
  unsubscribeUrl,
}: LayoutOptions) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5eee3;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader ?? title)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5eee3;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf7f1;border:1px solid #e2d5c3;">
            <tr>
              <td style="padding:32px 36px 20px;text-align:center;border-bottom:1px solid #e2d5c3;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:4px;color:#17110e;text-transform:uppercase;">${BRAND}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;color:#b58a4f;text-transform:uppercase;margin-top:8px;">Luxury Human Hair Atelier</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 36px 12px;font-family:Arial,Helvetica,sans-serif;color:#2a1f18;font-size:15px;line-height:1.7;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 32px;font-family:Arial,Helvetica,sans-serif;color:#6f5544;font-size:12px;line-height:1.7;">
                ${footerNote ? `<p style="margin:0 0 10px;">${footerNote}</p>` : ""}
                <p style="margin:0 0 6px;">${siteConfig.addressLine}, ${siteConfig.city} ${siteConfig.postcode}, ${siteConfig.country}</p>
                <p style="margin:0 0 6px;">
                  <a href="mailto:${siteConfig.supportEmail}" style="color:#6f5544;">${siteConfig.supportEmail}</a> ·
                  <a href="tel:${siteConfig.supportPhone.replace(/\s/g, "")}" style="color:#6f5544;">${siteConfig.supportPhone}</a>
                </p>
                <p style="margin:0 0 6px;">
                  <a href="${SITE}/account/orders" style="color:#6f5544;">Your account</a> ·
                  <a href="${SITE}/shipping" style="color:#6f5544;">Shipping</a> ·
                  <a href="${SITE}/returns" style="color:#6f5544;">Returns</a>
                  ${unsubscribeUrl ? ` · <a href="${unsubscribeUrl}" style="color:#6f5544;">Unsubscribe</a>` : ""}
                </p>
                <p style="margin:12px 0 0;color:#9a8877;">© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0;">
    <tr>
      <td style="background:#17110e;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#fbf7f1;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function addressLines(address: unknown) {
  const value = (address ?? {}) as Record<string, string | undefined>;
  return [
    value.fullName,
    value.line1,
    value.line2,
    [value.city, value.county].filter(Boolean).join(", "),
    value.postcode,
    value.country,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(String(line)))
    .join("<br />");
}

function orderItemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2d5c3;">
          <div style="color:#2a1f18;font-size:14px;">${escapeHtml(item.name)}</div>
          <div style="color:#6f5544;font-size:12px;">${escapeHtml(item.variantLabel)} · Qty ${item.quantity}</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #e2d5c3;color:#2a1f18;font-size:14px;white-space:nowrap;">
          ${formatMoneyExact(item.lineTotalPence, order.currency)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
    ${rows}
    <tr>
      <td style="padding:10px 0 2px;color:#6f5544;font-size:13px;">Subtotal</td>
      <td align="right" style="padding:10px 0 2px;color:#6f5544;font-size:13px;">${formatMoneyExact(order.subtotalPence, order.currency)}</td>
    </tr>
    ${
      order.discountPence > 0
        ? `<tr>
            <td style="padding:2px 0;color:#2f6b4f;font-size:13px;">Discount ${order.couponCode ? `(${escapeHtml(order.couponCode)})` : ""}</td>
            <td align="right" style="padding:2px 0;color:#2f6b4f;font-size:13px;">−${formatMoneyExact(order.discountPence, order.currency)}</td>
          </tr>`
        : ""
    }
    <tr>
      <td style="padding:2px 0;color:#6f5544;font-size:13px;">Shipping</td>
      <td align="right" style="padding:2px 0;color:#6f5544;font-size:13px;">${order.shippingPence === 0 ? "Free" : formatMoneyExact(order.shippingPence, order.currency)}</td>
    </tr>
    <tr>
      <td style="padding:14px 0 0;border-top:1px solid #2a1f18;color:#17110e;font-size:15px;font-weight:bold;">Total</td>
      <td align="right" style="padding:14px 0 0;border-top:1px solid #2a1f18;color:#17110e;font-size:15px;font-weight:bold;">${formatMoneyExact(order.totalPence, order.currency)}</td>
    </tr>
  </table>`;
}

export type OrderEmailOptions = {
  order: EmailOrder;
  setupUrl?: string;
  unsubscribeUrl?: string;
};

export function orderConfirmationEmail({
  order,
  setupUrl,
  unsubscribeUrl,
}: OrderEmailOptions): EmailContent {
  const firstName = order.customerName.split(" ")[0] || "there";
  const content = `
    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#17110e;">Thank you, ${escapeHtml(firstName)}.</p>
    <p style="margin:0 0 18px;">Your order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed. Our atelier team is preparing everything by hand and will email you again the moment it is on its way.</p>
    ${orderItemsTable(order)}
    <p style="margin:0 0 4px;font-size:13px;color:#6f5544;letter-spacing:1px;text-transform:uppercase;">Delivering to</p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;">${addressLines(order.shippingAddress)}</p>
    ${emailButton(`${SITE}/account/orders`, "View your order")}
    ${
      setupUrl
        ? `<div style="margin-top:8px;padding:20px;background:#f5eee3;border-left:3px solid #b58a4f;">
            <p style="margin:0 0 8px;font-size:14px;color:#2a1f18;"><strong>Create your account in one click</strong></p>
            <p style="margin:0 0 4px;font-size:13px;color:#6f5544;">Set a password to track this order, save addresses and check out faster next time. Your order is already linked to your email address.</p>
            ${emailButton(setupUrl, "Set my password")}
          </div>`
        : ""
    }
    <p style="margin:0;font-size:13px;color:#6f5544;">Need something? Reply to this email — a real person from the atelier will answer within one working day.</p>
  `;

  return {
    subject: `Order ${order.orderNumber} confirmed — ${BRAND}`,
    html: emailLayout({
      title: `Order ${order.orderNumber} confirmed`,
      preheader: `Thank you ${firstName} — we're preparing ${order.items.length} item(s) for you.`,
      content,
      footerNote: "Keep this email for your records.",
      unsubscribeUrl,
    }),
  };
}

const STATUS_COPY: Record<
  string,
  { subject: string; heading: string; message: string }
> = {
  PAID: {
    subject: "Payment received",
    heading: "Payment received",
    message:
      "Thank you — your payment has cleared. Your order now sits with the atelier team.",
  },
  PROCESSING: {
    subject: "We're preparing your order",
    heading: "Your hair is being prepared",
    message:
      "Each bundle is being checked, weighed and wrapped by hand. You'll get tracking details as soon as it leaves the studio.",
  },
  DISPATCHED: {
    subject: "Your order is on its way",
    heading: "On its way",
    message:
      "Your order has left the atelier and is with the courier. Use the tracking details below to follow it.",
  },
  COMPLETED: {
    subject: "Delivered — we'd love your review",
    heading: "Delivered",
    message:
      "Your order is marked as delivered. We'd love to see how you styled it — leave a review and tag us on Instagram.",
  },
  CANCELLED: {
    subject: "Your order has been cancelled",
    heading: "Order cancelled",
    message:
      "Your order has been cancelled. Any captured payment is refunded to your original method within 3–5 working days.",
  },
  REFUNDED: {
    subject: "Your refund has been processed",
    heading: "Refund processed",
    message:
      "We've processed your refund. Depending on your bank it can take 3–5 working days to appear on your statement.",
  },
  AWAITING_PAYMENT: {
    subject: "We're waiting for your payment",
    heading: "Payment pending",
    message:
      "Your order is reserved, but the payment provider hasn't confirmed it yet. Unpaid orders are released after 2 hours.",
  },
  PENDING: {
    subject: "We've received your order",
    heading: "Order received",
    message: "Your order has been received and is awaiting payment confirmation.",
  },
};

export type OrderStatusEmailOptions = {
  order: EmailOrder;
  status: string;
  note?: string;
  unsubscribeUrl?: string;
};

export function orderStatusEmail({
  order,
  status,
  note,
  unsubscribeUrl,
}: OrderStatusEmailOptions): EmailContent {
  const copy = STATUS_COPY[status] ?? {
    subject: "Your order has been updated",
    heading: "Order updated",
    message: `Your order is now marked as ${status.toLowerCase().replace(/_/g, " ")}.`,
  };

  const firstName = order.customerName.split(" ")[0] || "there";
  const tracking =
    status === "DISPATCHED" && order.trackingNumber
      ? `<div style="margin:20px 0;padding:18px 20px;background:#f5eee3;border-left:3px solid #b58a4f;">
          <p style="margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6f5544;">Tracking number</p>
          <p style="margin:0;font-size:16px;color:#17110e;letter-spacing:1px;">${escapeHtml(order.trackingNumber)}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#6f5544;">${escapeHtml(order.trackingCarrier ?? "Royal Mail")}</p>
        </div>`
      : "";

  const content = `
    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#17110e;">${escapeHtml(copy.heading)}</p>
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6f5544;">Order ${escapeHtml(order.orderNumber)}</p>
    <p style="margin:0 0 14px;">Hi ${escapeHtml(firstName)}, ${escapeHtml(copy.message)}</p>
    ${note ? `<p style="margin:0 0 14px;padding:14px 16px;background:#f5eee3;font-size:14px;color:#2a1f18;">${escapeHtml(note)}</p>` : ""}
    ${tracking}
    ${orderItemsTable(order)}
    ${emailButton(`${SITE}/account/orders`, "View order details")}
    <p style="margin:0;font-size:13px;color:#6f5544;">Questions? Reply to this email and we'll help.</p>
  `;

  return {
    subject: `${copy.subject} — ${order.orderNumber} — ${BRAND}`,
    html: emailLayout({
      title: copy.subject,
      preheader: copy.message,
      content,
      footerNote: "You're receiving this because you placed an order with us.",
      unsubscribeUrl,
    }),
  };
}

export function welcomeEmail({
  name,
  unsubscribeUrl,
}: {
  name?: string | null;
  unsubscribeUrl?: string;
}): EmailContent {
  const firstName = (name ?? "").split(" ")[0] || "lovely";
  const content = `
    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#17110e;">Welcome to ${BRAND}.</p>
    <p style="margin:0 0 14px;">Hi ${escapeHtml(firstName)}, we're so glad you're here. Your account is ready — you can save addresses, track orders and keep your wishlist in one place.</p>
    <p style="margin:0 0 14px;">Every bundle in our atelier is 100% Remy human hair, cuticle-aligned and double-drawn, so it behaves like your own hair from the first wear.</p>
    ${emailButton(`${SITE}/shop`, "Explore the collection")}
    <p style="margin:0;font-size:13px;color:#6f5544;">New here? Start with our <a href="${SITE}/hair-care" style="color:#6f5544;">hair care guide</a> — it's the fastest way to get a year of wear from your bundles.</p>
  `;
  return {
    subject: `Welcome to ${BRAND}`,
    html: emailLayout({
      title: `Welcome to ${BRAND}`,
      preheader: "Your account is ready — here's where to start.",
      content,
      footerNote: "You're receiving this because you created an account with us.",
      unsubscribeUrl,
    }),
  };
}

export function campaignEmail({
  subject,
  bodyHtml,
  unsubscribeUrl,
}: {
  subject: string;
  bodyHtml: string;
  unsubscribeUrl: string;
}): EmailContent {
  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: subject,
      content: `<div style="font-size:15px;line-height:1.7;color:#2a1f18;">${bodyHtml}</div>`,
      footerNote: "You're receiving this because you opted in to LushTresses emails.",
      unsubscribeUrl,
    }),
  };
}

export function adminOrderEmail({ order }: { order: EmailOrder }): EmailContent {
  const items = order.items
    .map(
      (item) =>
        `${escapeHtml(item.name)} — ${escapeHtml(item.variantLabel)} × ${item.quantity}`,
    )
    .join("<br />");

  const content = `
    <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#17110e;">New order ${escapeHtml(order.orderNumber)}</p>
    <p style="margin:0 0 14px;"><strong>${escapeHtml(order.customerName)}</strong> · ${escapeHtml(order.customerEmail)} · ${escapeHtml(order.customerPhone)}</p>
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6f5544;">Items</p>
    <p style="margin:0 0 14px;">${items}</p>
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#6f5544;">Total</p>
    <p style="margin:0 0 14px;font-size:18px;color:#17110e;">${formatMoneyExact(order.totalPence, order.currency)}</p>
    ${emailButton(`${SITE}/admin/orders/${order.id}`, "Open in admin")}
  `;

  return {
    subject: `New order ${order.orderNumber} — ${formatMoneyExact(order.totalPence, order.currency)}`,
    html: emailLayout({ title: `New order ${order.orderNumber}`, content }),
  };
}

export function guestSetupReminderEmail({
  name,
  setupUrl,
}: {
  name?: string | null;
  setupUrl: string;
}): EmailContent {
  const firstName = (name ?? "").split(" ")[0] || "there";
  return {
    subject: `Finish setting up your ${BRAND} account`,
    html: emailLayout({
      title: "Finish setting up your account",
      preheader: "One click to set your password.",
      content: `
        <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#17110e;">One last step, ${escapeHtml(firstName)}.</p>
        <p style="margin:0 0 14px;">Tap below to choose a password. Your orders, addresses and rewards will be waiting for you.</p>
        ${emailButton(setupUrl, "Set my password")}
        <p style="margin:0;font-size:13px;color:#6f5544;">This link expires in 48 hours. If it has expired, request a new one from the login page.</p>
      `,
    }),
  };
}


