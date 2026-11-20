import "server-only";

import type { Order, OrderItem } from "@prisma/client";

import { siteConfig } from "@/lib/constants";
import { defaultStoreContact, type StoreContact } from "@/lib/store-settings";
import { formatMoneyExact } from "@/lib/utils";

import {
  EMAIL_BRAND,
  emailButton,
  emailEyebrow,
  emailGoldRule,
  emailHeading,
  emailLink,
  emailList,
  emailMetaRows,
  emailPanel,
  emailPanelLabel,
  emailRule,
  emailSmallText,
  emailText,
  escapeHtml,
} from "./brand";

export { emailButton, escapeHtml };

export type EmailOrder = Order & { items: OrderItem[] };
export type EmailContent = { subject: string; html: string };

const BRAND = siteConfig.name;
const SITE = siteConfig.url.replace(/\/$/, "");
const C = EMAIL_BRAND.colors;
const F = EMAIL_BRAND.fonts;

type LayoutOptions = {
  title: string;
  preheader?: string;
  content: string;
  footerNote?: string;
  unsubscribeUrl?: string;
  /** Admin-managed address and contact details; defaults to the environment values. */
  contact?: StoreContact;
};

export function emailLayout({
  title,
  preheader,
  content,
  footerNote,
  unsubscribeUrl,
  contact,
}: LayoutOptions) {
  const year = new Date().getFullYear();
  const footerLink = `color:${C.mocha};text-decoration:none;`;
  const details = contact ?? defaultStoreContact;
  const address = [
    details.addressLine,
    details.addressLine2,
    [details.city, details.postcode].filter(Boolean).join(" "),
    details.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `<!doctype html>
<html lang="en" style="color-scheme:light only;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media only screen and (max-width:620px) {
        .email-wrap { padding:18px 8px !important; }
        .email-header { padding:26px 22px 20px !important; }
        .email-content { padding:26px 22px 10px !important; }
        .email-footer { padding:22px 22px 26px !important; }
        .email-wordmark { font-size:21px !important; letter-spacing:3.4px !important; }
        .email-content h1 { font-size:25px !important; line-height:1.3 !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${C.cream};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escapeHtml(
      preheader ?? title,
    )}${"&#847;&zwnj;&nbsp;".repeat(24)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
      <tr>
        <td class="email-wrap" align="center" style="padding:36px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${EMAIL_BRAND.width}px;background:${C.ivory};border:1px solid ${C.line};">
            <tr>
              <td height="4" style="height:4px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td class="email-header" style="padding:36px 40px 24px;text-align:center;border-bottom:1px solid ${C.line};">
                <a href="${SITE}" target="_blank" class="email-wordmark" style="display:inline-block;font-family:${F.display};font-size:25px;line-height:1.2;letter-spacing:5px;text-transform:uppercase;color:${C.ink};text-decoration:none;">${escapeHtml(
                  BRAND,
                )}</a>
                <div style="margin-top:9px;font-family:${F.sans};font-size:9px;font-weight:bold;letter-spacing:3.2px;text-transform:uppercase;color:${C.gold};">Luxury Human Hair Atelier</div>
                ${emailGoldRule()}
              </td>
            </tr>
            <tr>
              <td class="email-content" style="padding:34px 40px 12px;font-family:${F.sans};font-size:15px;line-height:1.7;color:${C.espresso};">
                ${content}
              </td>
            </tr>
            <tr>
              <td class="email-footer" style="padding:26px 40px 32px;background:${C.cream};border-top:1px solid ${C.line};font-family:${F.sans};font-size:12px;line-height:1.7;color:${C.mocha};">
                ${
                  footerNote
                    ? `<p style="margin:0 0 14px;font-size:12px;line-height:1.7;color:${C.mocha};">${escapeHtml(
                        footerNote,
                      )}</p>`
                    : ""
                }
                <p style="margin:0 0 3px;font-family:${F.display};font-size:14px;letter-spacing:2.4px;text-transform:uppercase;color:${C.ink};">${escapeHtml(
                  BRAND,
                )}</p>
                <p style="margin:0 0 12px;">${escapeHtml(address)}</p>
                <p style="margin:0 0 6px;">
                  <a href="mailto:${escapeHtml(details.supportEmail)}" style="${footerLink}">${escapeHtml(
                    details.supportEmail,
                  )}</a> &middot;
                  <a href="tel:${details.supportPhone.replace(/\s/g, "")}" style="${footerLink}">${escapeHtml(
                    details.supportPhone,
                  )}</a>
                </p>
                <p style="margin:0 0 6px;">
                  <a href="${SITE}/account/orders" style="${footerLink}">Your account</a> &middot;
                  <a href="${SITE}/shipping" style="${footerLink}">Shipping</a> &middot;
                  <a href="${SITE}/returns" style="${footerLink}">Returns</a>${
                    unsubscribeUrl
                      ? ` &middot; <a href="${escapeHtml(unsubscribeUrl)}" style="${footerLink}">Unsubscribe</a>`
                      : ""
                  }
                </p>
                <p style="margin:0 0 14px;">
                  ${
                    details.instagram
                      ? `<a href="${escapeHtml(details.instagram)}" style="${footerLink}">Instagram</a> &middot;`
                      : ""
                  }
                  <a href="${SITE}/contact" style="${footerLink}">Contact the atelier</a>
                </p>
                <p style="margin:0;padding-top:14px;border-top:1px solid ${C.line};font-size:11px;line-height:1.6;color:#9a8877;">
                  &copy; ${year} ${escapeHtml(BRAND)}. All rights reserved.<br />
                  ${escapeHtml(siteConfig.tagline)}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
        <td style="padding:14px 0;border-bottom:1px solid ${C.line};">
          <div style="font-family:${F.sans};color:${C.ink};font-size:14px;line-height:1.5;">${escapeHtml(item.name)}</div>
          <div style="margin-top:3px;font-family:${F.sans};color:${C.mocha};font-size:12px;line-height:1.5;">${escapeHtml(item.variantLabel)} &middot; Qty ${item.quantity}</div>
        </td>
        <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:${F.sans};color:${C.ink};font-size:14px;white-space:nowrap;">
          ${formatMoneyExact(item.lineTotalPence, order.currency)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
    <tr>
      <td colspan="2" style="padding:0 0 6px;font-family:${F.sans};font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.gold};">Your order</td>
    </tr>
    ${rows}
    <tr>
      <td style="padding:12px 0 2px;font-family:${F.sans};color:${C.mocha};font-size:13px;">Subtotal</td>
      <td align="right" style="padding:12px 0 2px;font-family:${F.sans};color:${C.mocha};font-size:13px;">${formatMoneyExact(order.subtotalPence, order.currency)}</td>
    </tr>
    ${
      order.discountPence > 0
        ? `<tr>
            <td style="padding:2px 0;font-family:${F.sans};color:${C.success};font-size:13px;">Discount ${order.couponCode ? `(${escapeHtml(order.couponCode)})` : ""}</td>
            <td align="right" style="padding:2px 0;font-family:${F.sans};color:${C.success};font-size:13px;">&minus;${formatMoneyExact(order.discountPence, order.currency)}</td>
          </tr>`
        : ""
    }
    <tr>
      <td style="padding:2px 0;font-family:${F.sans};color:${C.mocha};font-size:13px;">Shipping</td>
      <td align="right" style="padding:2px 0;font-family:${F.sans};color:${C.mocha};font-size:13px;">${order.shippingPence === 0 ? "Free" : formatMoneyExact(order.shippingPence, order.currency)}</td>
    </tr>
    <tr>
      <td style="padding:14px 0 0;border-top:1px solid ${C.ink};font-family:${F.sans};color:${C.ink};font-size:15px;font-weight:bold;">Total</td>
      <td align="right" style="padding:14px 0 0;border-top:1px solid ${C.ink};font-family:${F.sans};color:${C.ink};font-size:15px;font-weight:bold;">${formatMoneyExact(order.totalPence, order.currency)}</td>
    </tr>
  </table>`;
}

export type OrderEmailOptions = {
  order: EmailOrder;
  setupUrl?: string;
  unsubscribeUrl?: string;
  contact?: StoreContact;
};

export function orderConfirmationEmail({
  order,
  setupUrl,
  unsubscribeUrl,
  contact,
}: OrderEmailOptions): EmailContent {
  const firstName = order.customerName.split(" ")[0] || "there";
  const content = `
    ${emailEyebrow("Order confirmed")}
    ${emailHeading(`Thank you, ${firstName}.`)}
    ${emailText(
      `Your order <strong>${escapeHtml(
        order.orderNumber,
      )}</strong> is confirmed. Our atelier team is preparing everything by hand and will email you again the moment it is on its way.`,
    )}
    ${orderItemsTable(order)}
    ${emailPanel(
      `${emailPanelLabel("Delivering to")}<p style="margin:0;font-family:${F.sans};font-size:14px;line-height:1.65;color:${C.espresso};">${addressLines(
        order.shippingAddress,
      )}</p>`,
      { margin: "22px 0 4px" },
    )}
    ${emailButton(`${SITE}/account/orders`, "View your order")}
    ${
      setupUrl
        ? emailPanel(
            `${emailPanelLabel("One-click account")}
             <p style="margin:0 0 6px;font-family:${F.display};font-size:20px;line-height:1.3;color:${C.ink};">Create your account in one click</p>
             <p style="margin:0;font-family:${F.sans};font-size:13px;line-height:1.65;color:${C.mocha};">Set a password to track this order, save addresses and check out faster next time. Your order is already linked to your email address.</p>
             ${emailButton(setupUrl, "Set my password", { margin: "16px 0 0" })}`,
            { margin: "0 0 8px" },
          )
        : ""
    }
    ${emailRule("26px 0")}
    ${emailSmallText(
      "Need something? Reply to this email &mdash; a real person from the atelier will answer within one working day.",
      "0",
    )}
  `;

  return {
    subject: `Order ${order.orderNumber} confirmed — ${BRAND}`,
    html: emailLayout({
      title: `Order ${order.orderNumber} confirmed`,
      preheader: `Thank you ${firstName} — we're preparing ${order.items.length} item(s) for you.`,
      content,
      footerNote: "Keep this email for your records.",
      unsubscribeUrl,
      contact,
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
  contact?: StoreContact;
};

export function orderStatusEmail({
  order,
  status,
  note,
  unsubscribeUrl,
  contact,
}: OrderStatusEmailOptions): EmailContent {
  const copy = STATUS_COPY[status] ?? {
    subject: "Your order has been updated",
    heading: "Order updated",
    message: `Your order is now marked as ${status.toLowerCase().replace(/_/g, " ")}.`,
  };

  const firstName = order.customerName.split(" ")[0] || "there";
  const tracking =
    status === "DISPATCHED" && order.trackingNumber
      ? emailPanel(
          `${emailPanelLabel("Tracking number")}
           <p style="margin:0;font-family:${F.sans};font-size:19px;letter-spacing:1.4px;color:${C.ink};">${escapeHtml(
             order.trackingNumber,
           )}</p>
           <p style="margin:5px 0 0;font-family:${F.sans};font-size:13px;color:${C.mocha};">${escapeHtml(
             order.trackingCarrier ?? "Royal Mail",
           )}</p>
           <p style="margin:10px 0 0;font-family:${F.sans};font-size:13px;line-height:1.6;color:${C.mocha};">Follow it with the courier &mdash; tracking can take a few hours to update after dispatch.</p>`,
        )
      : "";

  const content = `
    ${emailEyebrow("Order update")}
    ${emailHeading(copy.heading)}
    <p style="margin:0 0 18px;font-family:${F.sans};font-size:11px;font-weight:bold;letter-spacing:1.8px;text-transform:uppercase;color:${C.mocha};">Order <span style="color:${C.ink};">${escapeHtml(
      order.orderNumber,
    )}</span></p>
    ${emailText(`Hi ${escapeHtml(firstName)}, ${escapeHtml(copy.message)}`)}
    ${
      note
        ? emailPanel(
            `<p style="margin:0;font-family:${F.sans};font-size:14px;line-height:1.65;color:${C.espresso};">${escapeHtml(
              note,
            )}</p>`,
            { margin: "0 0 18px" },
          )
        : ""
    }
    ${tracking}
    ${orderItemsTable(order)}
    ${emailButton(`${SITE}/account/orders`, "View order details")}
    ${emailSmallText("Questions? Reply to this email and we'll help.", "0")}
  `;

  return {
    subject: `${copy.subject} — ${order.orderNumber} — ${BRAND}`,
    html: emailLayout({
      title: copy.subject,
      preheader: copy.message,
      content,
      footerNote: "You're receiving this because you placed an order with us.",
      unsubscribeUrl,
      contact,
    }),
  };
}

export function welcomeEmail({
  name,
  unsubscribeUrl,
  contact,
}: {
  name?: string | null;
  unsubscribeUrl?: string;
  contact?: StoreContact;
}): EmailContent {
  const firstName = (name ?? "").split(" ")[0] || "lovely";
  const content = `
    ${emailEyebrow("Welcome")}
    ${emailHeading(`Welcome to ${BRAND}.`)}
    ${emailText(
      `Hi ${escapeHtml(
        firstName,
      )}, we're so glad you're here. Your account is ready — you can save addresses, track orders and keep your wishlist in one place.`,
    )}
    ${emailText(
      "Every piece in our atelier is 100% Remy human hair, cuticle-aligned and double-drawn, so it behaves like your own hair from the first wear.",
      { margin: "0 0 6px" },
    )}
    ${emailList([
      `<strong style="color:${C.ink};">100% Remy human hair</strong> &mdash; cuticle-aligned and double-drawn`,
      `<strong style="color:${C.ink};">Hand-checked in London</strong> &mdash; weighed, wrapped and photographed by our team`,
      `<strong style="color:${C.ink};">Care that lasts</strong> &mdash; simple rituals keep your bundles beautiful for a year`,
    ])}
    ${emailButton(`${SITE}/shop`, "Explore the collection")}
    ${emailRule("26px 0")}
    ${emailSmallText(
      `New here? Start with our ${emailLink(
        `${SITE}/hair-care`,
        "hair care guide",
      )} — it's the fastest way to get a year of wear from your bundles.`,
      "0",
    )}
  `;
  return {
    subject: `Welcome to ${BRAND}`,
    html: emailLayout({
      title: `Welcome to ${BRAND}`,
      preheader: "Your account is ready — here's where to start.",
      content,
      footerNote: "You're receiving this because you created an account with us.",
      unsubscribeUrl,
      contact,
    }),
  };
}

export function campaignEmail({
  subject,
  bodyHtml,
  unsubscribeUrl,
  contact,
}: {
  subject: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  contact?: StoreContact;
}): EmailContent {
  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: subject,
      content: `<div style="font-family:${F.sans};font-size:15px;line-height:1.7;color:${C.espresso};">${bodyHtml}</div>`,
      footerNote: "You're receiving this because you opted in to The Elites House emails.",
      unsubscribeUrl,
      contact,
    }),
  };
}

export function adminOrderEmail({
  order,
  contact,
}: {
  order: EmailOrder;
  contact?: StoreContact;
}): EmailContent {
  const items = order.items.map(
    (item) =>
      `<strong style="color:${C.ink};">${escapeHtml(item.name)}</strong><br /><span style="color:${C.mocha};font-size:13px;">${escapeHtml(
        item.variantLabel,
      )} &middot; Qty ${item.quantity}</span>`,
  );

  const content = `
    ${emailEyebrow("New order")}
    ${emailHeading(`New order ${order.orderNumber}`)}
    ${emailMetaRows([
      { label: "Customer", value: order.customerName },
      { label: "Email", value: order.customerEmail },
      { label: "Phone", value: order.customerPhone },
    ])}
    ${emailPanelLabel("Items")}
    ${emailList(items, "0 0 8px")}
    ${emailPanel(
      `${emailPanelLabel("Order total")}<p style="margin:0;font-family:${F.display};font-size:26px;line-height:1.2;color:${C.ink};">${formatMoneyExact(
        order.totalPence,
        order.currency,
      )}</p>`,
      { margin: "0 0 4px" },
    )}
    ${emailButton(`${SITE}/admin/orders/${order.id}`, "Open in admin")}
  `;

  return {
    subject: `New order ${order.orderNumber} — ${formatMoneyExact(order.totalPence, order.currency)}`,
    html: emailLayout({ title: `New order ${order.orderNumber}`, content, contact }),
  };
}

export function guestSetupReminderEmail({
  name,
  setupUrl,
  contact,
}: {
  name?: string | null;
  setupUrl: string;
  contact?: StoreContact;
}): EmailContent {
  const firstName = (name ?? "").split(" ")[0] || "there";
  return {
    subject: `Finish setting up your ${BRAND} account`,
    html: emailLayout({
      title: "Finish setting up your account",
      preheader: "One click to set your password.",
      content: `
        ${emailEyebrow("Account setup")}
        ${emailHeading(`One last step, ${firstName}.`)}
        ${emailText(
          "Tap below to choose a password. Your orders, addresses and rewards will be waiting for you.",
        )}
        ${emailButton(setupUrl, "Set my password")}
        ${emailRule("24px 0")}
        ${emailSmallText(
          "This link expires in 48 hours. If it has expired, request a new one from the login page.",
          "0",
        )}
      `,
      contact,
    }),
  };
}


