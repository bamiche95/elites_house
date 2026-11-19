/**
 * The Elites House email design tokens and reusable, inline-styled fragments.
 *
 * This module is intentionally dependency-free (no `server-only`, no path aliases)
 * so it can be shared by the transactional templates, the admin preview and the
 * Prisma seed/refresh scripts.
 *
 * Every fragment is table-based and inline-styled because Gmail, Outlook and
 * Apple Mail strip <style> blocks and external fonts. The palette mirrors
 * `src/app/globals.css`.
 */

export const EMAIL_BRAND = {
  colors: {
    ivory: "#fbf7f1",
    cream: "#f5eee3",
    sand: "#e9dcc9",
    line: "#e2d5c3",
    ink: "#17110e",
    espresso: "#2a1f18",
    mocha: "#6f5544",
    gold: "#b58a4f",
    goldSoft: "#d9bb8c",
    success: "#2f6b4f",
    danger: "#a13a35",
    white: "#ffffff",
  },
  fonts: {
    display: "Georgia,'Times New Roman',serif",
    sans: "Arial,Helvetica,sans-serif",
  },
  width: 600,
} as const;

const C = EMAIL_BRAND.colors;
const F = EMAIL_BRAND.fonts;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Small uppercase label that opens a section. */
export function emailEyebrow(text: string, color: string = C.gold) {
  return `<p style="margin:0 0 10px;font-family:${F.sans};font-size:10px;font-weight:bold;letter-spacing:2.4px;text-transform:uppercase;color:${color};">${escapeHtml(
    text,
  )}</p>`;
}

/** Editorial serif headline. */
export function emailHeading(
  text: string,
  options: { size?: number; margin?: string; align?: "left" | "center" } = {},
) {
  const { size = 28, margin = "0 0 16px", align = "left" } = options;
  return `<h1 style="margin:${margin};font-family:${F.display};font-size:${size}px;font-weight:normal;line-height:1.25;letter-spacing:0.2px;color:${C.ink};text-align:${align};">${escapeHtml(
    text,
  )}</h1>`;
}

/**
 * Body paragraph. `html` is trusted markup — escape any interpolated values
 * with `escapeHtml` before passing them in.
 */
export function emailText(
  html: string,
  options: {
    margin?: string;
    size?: number;
    color?: string;
    align?: "left" | "center";
  } = {},
) {
  const { margin = "0 0 16px", size = 15, color = C.espresso, align = "left" } = options;
  return `<p style="margin:${margin};font-family:${F.sans};font-size:${size}px;line-height:1.7;color:${color};text-align:${align};">${html}</p>`;
}

/** Muted supporting copy, e.g. delivery notes or helpline hints. */
export function emailSmallText(html: string, margin = "0 0 12px") {
  return emailText(html, { margin, size: 13, color: C.mocha });
}

export function emailLink(href: string, label: string) {
  return `<a href="${escapeHtml(
    href,
  )}" style="color:${C.espresso};text-decoration:underline;text-decoration-color:${C.goldSoft};">${escapeHtml(
    label,
  )}</a>`;
}


/** Primary (ink + gold keyline) or outline call-to-action button. */
export function emailButton(
  href: string,
  label: string,
  options: {
    variant?: "primary" | "outline";
    align?: "left" | "center";
    margin?: string;
  } = {},
) {
  const { variant = "primary", align = "left", margin = "26px 0" } = options;
  const primary = variant === "primary";
  const background = primary ? C.ink : C.ivory;
  const color = primary ? C.ivory : C.ink;
  const border = primary ? `1px solid ${C.ink}` : `1px solid ${C.gold}`;
  const keyline = primary ? `border-bottom:2px solid ${C.gold};` : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">
    <tr>
      <td align="${align}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:${background};border:${border};${keyline}">
              <a href="${escapeHtml(
                href,
              )}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${F.sans};font-size:11px;font-weight:bold;letter-spacing:2.2px;line-height:1;text-transform:uppercase;color:${color};text-decoration:none;">${escapeHtml(
                label,
              )}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

/** Cream callout with a gold left rule. `html` is trusted markup. */
export function emailPanel(
  html: string,
  options: { background?: string; accent?: string; margin?: string } = {},
) {
  const { background = C.cream, accent = C.gold, margin = "22px 0" } = options;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">
    <tr>
      <td style="padding:20px 22px;background:${background};border-left:3px solid ${accent};font-family:${F.sans};font-size:14px;line-height:1.65;color:${C.espresso};">${html}</td>
    </tr>
  </table>`;
}

/** Thin sand rule used to separate content blocks. */
export function emailRule(margin = "24px 0") {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">
    <tr><td style="height:1px;background:${C.line};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

/** Label / value rows (customer details, order references, totals). */
export function emailMetaRows(
  rows: Array<{ label: string; value: string; raw?: boolean }>,
  margin = "0 0 20px",
) {
  const body = rows
    .map(
      ({ label, value, raw }) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${F.sans};font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${C.mocha};">${escapeHtml(
          label,
        )}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${F.sans};font-size:14px;color:${C.ink};">${
          raw ? value : escapeHtml(value)
        }</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">${body}</table>`;
}

/** Gold-diamond bullet list. `items` are trusted markup. */
export function emailList(items: string[], margin = "0 0 20px") {
  const body = items
    .map(
      (item) => `<tr>
        <td valign="top" style="width:18px;padding:5px 0;font-family:${F.sans};font-size:11px;line-height:1.7;color:${C.gold};">&#9670;</td>
        <td style="padding:5px 0;font-family:${F.sans};font-size:14px;line-height:1.7;color:${C.espresso};">${item}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};">${body}</table>`;
}

/** Small caps label used inside panels. */
export function emailPanelLabel(text: string) {
  return `<p style="margin:0 0 8px;font-family:${F.sans};font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${C.mocha};">${escapeHtml(
    text,
  )}</p>`;
}

/** Gold hairline used beneath the wordmark in the shared layout. */
export function emailGoldRule(width = 44, margin = "14px auto 0") {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:${margin};">
    <tr><td width="${width}" height="1" style="width:${width}px;height:1px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}
