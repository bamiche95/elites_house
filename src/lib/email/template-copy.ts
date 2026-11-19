/**
 * Seed copy for the `EmailTemplate` records managed in /admin/emails.
 *
 * These records are the editable reference copy shown in the admin — live
 * transactional sends come from `templates.ts`. Every body is a content
 * fragment: the admin preview wraps it in the shared `emailLayout`.
 *
 * Kept free of `server-only` and path aliases so `prisma/seed.ts` and
 * `scripts/refresh-email-templates.ts` can import it.
 */

import {
  EMAIL_BRAND,
  emailButton,
  emailEyebrow,
  emailHeading,
  emailLink,
  emailList,
  emailPanel,
  emailPanelLabel,
  emailRule,
  emailSmallText,
  emailText,
} from "./brand";

export type EmailTemplateCopy = {
  name: string;
  description: string;
  subject: string;
  preheader: string;
  bodyHtml: string;
};

const C = EMAIL_BRAND.colors;
const F = EMAIL_BRAND.fonts;

const previewOrderSummary = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px;">
  <tr>
    <td colspan="2" style="padding:0 0 6px;font-family:${F.sans};font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.gold};">Your order</td>
  </tr>
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid ${C.line};">
      <div style="font-family:${F.sans};font-size:14px;color:${C.ink};">Silk Press Bone Straight</div>
      <div style="margin-top:3px;font-family:${F.sans};font-size:12px;color:${C.mocha};">22&quot; &middot; Natural Black &middot; Qty 1</div>
    </td>
    <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:${F.sans};font-size:14px;color:${C.ink};white-space:nowrap;">&pound;185.00</td>
  </tr>
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid ${C.line};">
      <div style="font-family:${F.sans};font-size:14px;color:${C.ink};">HD Lace Frontal 13x4</div>
      <div style="margin-top:3px;font-family:${F.sans};font-size:12px;color:${C.mocha};">20&quot; &middot; Natural Black &middot; Qty 1</div>
    </td>
    <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ${C.line};font-family:${F.sans};font-size:14px;color:${C.ink};white-space:nowrap;">&pound;145.00</td>
  </tr>
  <tr>
    <td style="padding:12px 0 2px;font-family:${F.sans};font-size:13px;color:${C.mocha};">Subtotal</td>
    <td align="right" style="padding:12px 0 2px;font-family:${F.sans};font-size:13px;color:${C.mocha};">&pound;330.00</td>
  </tr>
  <tr>
    <td style="padding:2px 0;font-family:${F.sans};font-size:13px;color:${C.mocha};">Shipping</td>
    <td align="right" style="padding:2px 0;font-family:${F.sans};font-size:13px;color:${C.mocha};">Free</td>
  </tr>
  <tr>
    <td style="padding:14px 0 0;border-top:1px solid ${C.ink};font-family:${F.sans};font-size:15px;font-weight:bold;color:${C.ink};">Total</td>
    <td align="right" style="padding:14px 0 0;border-top:1px solid ${C.ink};font-family:${F.sans};font-size:15px;font-weight:bold;color:${C.ink};">&pound;330.00</td>
  </tr>
</table>`;

const previewGuestSetupBlock = emailPanel(
  `${emailPanelLabel("One-click account")}
   <p style="margin:0 0 6px;font-family:${F.display};font-size:20px;line-height:1.3;color:${C.ink};">Create your account in one click</p>
   <p style="margin:0;font-family:${F.sans};font-size:13px;line-height:1.65;color:${C.mocha};">Set a password to track this order, save addresses and check out faster next time.</p>
   ${emailButton("#", "Set my password", { margin: "16px 0 0" })}`,
  { margin: "0 0 8px" },
);

export const emailTemplates: EmailTemplateCopy[] = [
  {
    name: "welcome",
    description: "Sent when a shopper creates an account.",
    subject: "Welcome to The Elites House",
    preheader: "Your account is ready — here's where to start.",
    bodyHtml: `
      ${emailEyebrow("Welcome")}
      ${emailHeading("Welcome to The Elites House.")}
      ${emailText(
        "Hi {{customer_first_name}}, we're so glad you're here. Your account is ready — save addresses, track orders and keep your wishlist in one place.",
      )}
      ${emailList([
        `<strong style="color:${C.ink};">100% Remy human hair</strong> &mdash; cuticle-aligned and double-drawn`,
        `<strong style="color:${C.ink};">Hand-checked in London</strong> &mdash; weighed, wrapped and photographed by our team`,
        `<strong style="color:${C.ink};">Care that lasts</strong> &mdash; simple rituals keep your bundles beautiful for a year`,
      ])}
      ${emailButton("{{site_url}}/shop", "Explore the collection")}
      ${emailRule("26px 0")}
      ${emailSmallText(
        `New here? Start with our ${emailLink(
          "{{site_url}}/hair-care",
          "hair care guide",
        )} — it's the fastest way to get a year of wear from your bundles.`,
        "0",
      )}
    `,
  },
  {
    name: "order-confirmation",
    description: "Payment confirmed — includes the guest account setup link.",
    subject: "Order {{order_number}} confirmed — The Elites House",
    preheader: "We're preparing your order by hand.",
    bodyHtml: `
      ${emailEyebrow("Order confirmed")}
      ${emailHeading("Thank you, {{customer_first_name}}.")}
      ${emailText(
        "Your order <strong>{{order_number}}</strong> is confirmed. Our atelier team is preparing everything by hand and will email you again the moment it is on its way.",
      )}
      {{order_summary}}
      {{guest_setup_block}}
      ${emailButton("{{site_url}}/account/orders", "View your order")}
      ${emailSmallText(
        "Need something? Reply to this email and a real person from the atelier will answer within one working day.",
        "0",
      )}
    `,
  },
  {
    name: "order-dispatched",
    description: "Sent when the atelier marks an order as dispatched.",
    subject: "Your order is on its way — {{order_number}}",
    preheader: "Tracking details inside.",
    bodyHtml: `
      ${emailEyebrow("Order update")}
      ${emailHeading("On its way")}
      ${emailText(
        "Hi {{customer_first_name}}, your order has left the atelier and is with the courier. Use the tracking details below to follow it.",
      )}
      ${emailPanel(
        `${emailPanelLabel("Tracking number")}
         <p style="margin:0;font-family:${F.sans};font-size:19px;letter-spacing:1.4px;color:${C.ink};">{{tracking_number}}</p>
         <p style="margin:5px 0 0;font-family:${F.sans};font-size:13px;color:${C.mocha};">{{tracking_carrier}}</p>`,
      )}
      {{order_summary}}
      ${emailButton("{{site_url}}/account/orders", "View order details")}
      ${emailSmallText("Questions? Reply to this email and we'll help.", "0")}
    `,
  },
  {
    name: "order-cancelled",
    description: "Sent when an order is cancelled and stock released.",
    subject: "Your order {{order_number}} has been cancelled",
    preheader: "Any captured payment is refunded automatically.",
    bodyHtml: `
      ${emailEyebrow("Order update")}
      ${emailHeading("Order cancelled")}
      ${emailText(
        "Hi {{customer_first_name}}, your order <strong>{{order_number}}</strong> has been cancelled. Any captured payment is refunded to your original method within 3–5 working days.",
      )}
      ${emailPanel(
        `${emailPanelLabel("What happens next")}
         <p style="margin:0;font-family:${F.sans};font-size:13px;line-height:1.65;color:${C.mocha};">The reserved stock has been released. Your bank will confirm the refund separately — it usually appears within 3–5 working days.</p>`,
      )}
      ${emailSmallText(
        `Need help? Reply to this email and we'll look into it, or read our ${emailLink(
          "{{site_url}}/returns",
          "returns policy",
        )}.`,
        "0",
      )}
    `,
  },
  {
    name: "guest-setup",
    description: "One-time password setup link for guest buyers.",
    subject: "Finish setting up your The Elites House account",
    preheader: "One click to set your password.",
    bodyHtml: `
      ${emailEyebrow("Account setup")}
      ${emailHeading("One last step")}
      ${emailText(
        "Hi {{customer_first_name}}, tap below to choose a password. Your orders, addresses and rewards will be waiting for you.",
      )}
      ${emailButton("{{setup_url}}", "Set my password")}
      ${emailRule("24px 0")}
      ${emailSmallText(
        "This link expires in 48 hours. If it has expired, request a new one from the login page.",
        "0",
      )}
    `,
  },
  {
    name: "restock-alert",
    description: "Use for back-in-stock campaigns.",
    subject: "Back in stock: {{product_name}}",
    preheader: "Your length is available again.",
    bodyHtml: `
      ${emailEyebrow("Back in the atelier")}
      ${emailHeading("{{product_name}} is back")}
      ${emailText(
        "Your length is available again. Small batches sell through quickly — we recommend securing yours while it is in stock.",
      )}
      ${emailButton("{{product_url}}", "Shop now")}
      ${emailPanel(
        `${emailPanelLabel("Atelier note")}
         <p style="margin:0;font-family:${F.sans};font-size:13px;line-height:1.65;color:${C.mocha};">Restocks are announced to our list first. Reply to this email if you'd like help choosing your length.</p>`,
      )}
      ${emailSmallText("New lengths, restocks and styling notes — twice a month, never more.", "0")}
    `,
  },
  {
    name: "newsletter",
    description: "Base layout for the fortnightly Atelier Letter.",
    subject: "The Atelier Letter",
    preheader: "Restocks, styling notes and early access.",
    bodyHtml: `
      ${emailEyebrow("The Atelier Letter")}
      ${emailHeading("The Atelier Letter")}
      ${emailText(
        "Write your introduction here, then add product links and styling notes. Keep it short, warm and useful — one idea, one invitation.",
      )}
      ${emailButton("{{site_url}}/shop", "Shop the collection")}
      ${emailRule("26px 0")}
      ${emailSmallText(
        `A note from the atelier — restocks, styling notes and early access, twice a month.`,
        "0",
      )}
    `,
  },
];

/**
 * Fills a template's merge tags with realistic sample data for the admin
 * preview. Unknown tags are left untouched so editors can spot typos.
 */
export function renderTemplatePreview(
  bodyHtml: string,
  siteUrl = "https://theeliteshouse.com",
) {
  const site = siteUrl.replace(/\/$/, "");
  const values: Record<string, string> = {
    customer_first_name: "Amara",
    order_number: "TEH-10482",
    order_summary: previewOrderSummary,
    guest_setup_block: previewGuestSetupBlock,
    tracking_number: "RM884219065GB",
    tracking_carrier: "Royal Mail",
    setup_url: `${site}/account/setup?token=preview`,
    product_url: `${site}/shop/silk-press-bone-straight`,
    product_name: "Silk Press Bone Straight 22&Prime;",
    site_url: site,
  };

  return bodyHtml.replace(
    /\{\{\s*([a-z0-9_]+)\s*\}\}/gi,
    (match, key: string) => values[key.toLowerCase()] ?? match,
  );
}
