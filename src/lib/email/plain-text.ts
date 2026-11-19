/**
 * Markdown-lite authoring for the branded email body.
 *
 * The database still stores a complete `bodyHtml` fragment. This module turns
 * the friendly plain-text shorthand used in /admin/emails into the same
 * table-based, inline-styled fragments as `brand.ts`, and turns those fragments
 * back into readable copy for the editor.
 *
 * Kept free of `server-only` and path aliases so the admin client component and
 * the server action can share it.
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
  escapeHtml,
} from "./brand";

const C = EMAIL_BRAND.colors;
const F = EMAIL_BRAND.fonts;

export const EMAIL_PLAIN_TEXT_GUIDE = [
  { syntax: "## Eyebrow", description: "Small gold uppercase label above the headline." },
  { syntax: "# Headline", description: "Large editorial serif headline." },
  { syntax: "Paragraph", description: "Body copy. Leave a blank line between paragraphs." },
  { syntax: "- Item", description: "Gold-diamond bullet list item." },
  { syntax: "> Label", description: "Opens a cream callout panel; the first line is its label." },
  { syntax: "> Detail", description: "Supporting line inside the panel." },
  { syntax: ">! Detail", description: "Emphasised panel line, used for tracking numbers." },
  { syntax: "[Button: Label](url)", description: "Primary ink and gold call-to-action button." },
  { syntax: "---", description: "Thin sand divider." },
  { syntax: "_Small print_", description: "Muted supporting copy." },
  { syntax: "**bold** *italic* [link](url)", description: "Inline formatting inside copy." },
] as const;

export const EMAIL_MERGE_TAGS = [
  "customer_first_name",
  "order_number",
  "order_summary",
  "guest_setup_block",
  "tracking_number",
  "tracking_carrier",
  "setup_url",
  "product_name",
  "product_url",
  "site_url",
] as const;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  middot: "·",
  pound: "£",
  prime: "′",
  Prime: "″",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
  zwnj: "",
};

function decodeCodePoint(value: string, radix: number, fallback: string) {
  const code = Number.parseInt(value, radix);
  return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
    ? String.fromCodePoint(code)
    : fallback;
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) =>
      decodeCodePoint(hex, 16, match),
    )
    .replace(/&#(\d+);/g, (match, decimal: string) =>
      decodeCodePoint(decimal, 10, match),
    )
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name: string) => {
      return NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? match;
    });
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

function safeHref(href: string) {
  const value = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#|\{\{)/i.test(value)) return value;
  return "#";
}

/** Escape the plain text first, then apply the small inline formatting set. */
function inlineToHtml(value: string) {
  const links: string[] = [];
  let text = value.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, href: string) => {
      const token = `\u0000${links.length}\u0000`;
      links.push(emailLink(safeHref(href), label));
      return token;
    },
  );

  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.ink};">$1</strong>`);
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  return text.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => links[Number(index)] ?? "");
}

/** Convert generated inline markup back into readable Markdown-lite. */
function inlineHtmlToPlain(html: string) {
  const linked = html.replace(
    /<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, label: string) => `[${stripTags(label)}](${decodeHtml(href)})`,
  );

  return decodeHtml(
    linked
      .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
      .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
      .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
      .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

type HtmlElement = {
  tag: string;
  attrs: string;
  inner: string;
  raw: string;
  end: number;
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function findNext(pattern: RegExp, from: number, html: string) {
  pattern.lastIndex = from;
  const match = pattern.exec(html);
  return match ? { index: match.index, length: match[0].length } : null;
}

/** Read one balanced element, counting same-name nested tags (e.g. tables). */
function readElement(html: string, start: number): HtmlElement | null {
  const open = /^<([a-zA-Z][\w-]*)([^>]*)>/.exec(html.slice(start));
  if (!open) return null;

  const tag = open[1].toLowerCase();
  const attrs = open[2] ?? "";
  const openEnd = start + open[0].length;

  if (VOID_TAGS.has(tag) || attrs.trim().endsWith("/")) {
    return { tag, attrs, inner: "", raw: open[0], end: openEnd };
  }

  const openPattern = new RegExp(`<${tag}\\b`, "gi");
  const closePattern = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 1;
  let cursor = openEnd;

  while (cursor < html.length) {
    const nextOpen = findNext(openPattern, cursor, html);
    const nextClose = findNext(closePattern, cursor, html);
    if (!nextClose) return null;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen.length;
      continue;
    }

    depth -= 1;
    const end = nextClose.index + nextClose.length;
    if (depth === 0) {
      return {
        tag,
        attrs,
        inner: html.slice(openEnd, nextClose.index),
        raw: html.slice(start, end),
        end,
      };
    }
    cursor = end;
  }

  return null;
}

function fenceHtml(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (value.includes("```")) return value;
  return `\`\`\`html\n${value}\n\`\`\``;
}

function isPanelLabelAttrs(attrs: string) {
  return attrs.includes("font-size:10px") && attrs.includes("letter-spacing:2px");
}

function panelToPlain(raw: string) {
  const cellStart = /<td\b[^>]*style="[^"]*border-left:3px solid[^"]*"[^>]*>/i.exec(raw);
  const cell = cellStart ? readElement(raw, cellStart.index) : null;
  const inner = cell?.inner ?? raw;
  const paragraphs = [...inner.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)];
  const lines: string[] = [];
  let labelSeen = false;

  for (const paragraph of paragraphs) {
    const attrs = paragraph[1] ?? "";
    const text = inlineHtmlToPlain(paragraph[2] ?? "");
    if (!text) continue;

    if (!labelSeen) {
      lines.push(`> ${text}`);
      labelSeen = true;
      continue;
    }

    lines.push(attrs.includes("font-size:19px") ? `>! ${text}` : `> ${text}`);
  }

  if (lines.length === 0) {
    const text = inlineHtmlToPlain(inner);
    if (text) lines.push(`> ${text}`);
  }

  return lines.join("\n");
}

function buttonToPlain(raw: string) {
  const match = /<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(raw);
  if (!match) return fenceHtml(raw);
  return `[Button: ${inlineHtmlToPlain(match[2] ?? "")}](${decodeHtml(match[1] ?? "")})`;
}

function listToPlain(raw: string) {
  const items = [...raw.matchAll(/<td[^>]*>\s*&#9670;\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((match) => inlineHtmlToPlain(match[1] ?? ""))
    .filter(Boolean);

  if (items.length === 0) return fenceHtml(raw);
  return items.map((item) => `- ${item}`).join("\n");
}

function tableToPlain(raw: string) {
  if (raw.includes("border-left:3px solid")) return panelToPlain(raw);
  if (raw.includes("padding:15px 30px")) return buttonToPlain(raw);
  if (raw.includes("&#9670;") || raw.includes("◆")) return listToPlain(raw);
  if (/height:1px;background:/i.test(raw)) return "---";
  return fenceHtml(raw);
}

function paragraphToPlain(attrs: string, inner: string, raw: string) {
  const text = inlineHtmlToPlain(inner);
  if (!text) return "";

  if (attrs.includes("font-size:10px") && attrs.includes("letter-spacing:2.4px")) {
    return `## ${text}`;
  }
  if (isPanelLabelAttrs(attrs)) return `> ${text}`;
  if (attrs.includes("font-size:13px") && attrs.includes(`color:${C.mocha}`)) {
    return `_${text}_`;
  }
  if (attrs.includes("font-size:15px")) return text;
  return fenceHtml(raw);
}

function htmlListToPlain(inner: string) {
  const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => inlineHtmlToPlain(match[1] ?? ""))
    .filter(Boolean);
  return items.map((item) => `- ${item}`).join("\n");
}

const CONTAINER_TAGS = new Set([
  "article",
  "center",
  "div",
  "footer",
  "header",
  "main",
  "section",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
]);

function blockToPlain(tag: string, attrs: string, inner: string, raw: string): string {
  if (tag === "table") return tableToPlain(raw);
  if (tag === "p") return paragraphToPlain(attrs, inner, raw);
  if (/^h[1-6]$/.test(tag)) {
    const text = inlineHtmlToPlain(inner);
    return text ? `# ${text}` : "";
  }
  if (tag === "ul" || tag === "ol") return htmlListToPlain(inner);
  if (tag === "li") {
    const text = inlineHtmlToPlain(inner);
    return text ? `- ${text}` : "";
  }
  if (tag === "br") return "";
  if (CONTAINER_TAGS.has(tag)) return htmlFragmentToPlain(inner);
  return inlineHtmlToPlain(inner);
}

function pushTextBlocks(chunk: string, blocks: string[]) {
  for (const line of chunk.split(/\r?\n/)) {
    const value = line.trim();
    if (value) blocks.push(value);
  }
}

function htmlFragmentToPlain(html: string) {
  const blocks: string[] = [];
  let index = 0;

  while (index < html.length) {
    if (/\s/.test(html[index] ?? "")) {
      index += 1;
      continue;
    }

    if (html.startsWith("```html", index)) {
      const fenceEnd = html.indexOf("```", index + 7);
      const raw = html.slice(index + 7, fenceEnd === -1 ? html.length : fenceEnd).trim();
      if (raw) blocks.push(raw);
      index = fenceEnd === -1 ? html.length : fenceEnd + 3;
      continue;
    }

    if (html.startsWith("{{", index)) {
      const mergeEnd = html.indexOf("}}", index);
      const value = html.slice(index, mergeEnd === -1 ? html.length : mergeEnd + 2).trim();
      if (value) blocks.push(value);
      index = mergeEnd === -1 ? html.length : mergeEnd + 2;
      continue;
    }

    if (html.startsWith("<", index)) {
      const element = readElement(html, index);
      if (element) {
        const value = blockToPlain(element.tag, element.attrs, element.inner, element.raw);
        if (value.trim()) blocks.push(value.trim());
        index = element.end;
        continue;
      }
    }

    const nextTag = html.indexOf("<", index + 1);
    const end = nextTag === -1 ? html.length : nextTag;
    pushTextBlocks(html.slice(index, end), blocks);
    index = end;
  }

  return blocks.join("\n\n");
}

export function emailHtmlToPlain(html: string) {
  if (!html.trim()) return "";
  return htmlFragmentToPlain(html).replace(/\n{3,}/g, "\n\n").trim();
}

function panelDetailsToHtml(lines: string[]) {
  return lines
    .map((line, index) => {
      const emphasis = line.startsWith("!");
      const content = emphasis ? line.slice(1).trimStart() : line;
      if (!content) return "";
      const margin = index === 0 ? "0" : "5px 0 0";
      const letterSpacing = emphasis ? "letter-spacing:1.4px;" : "";
      const lineHeight = emphasis ? 1.4 : 1.65;
      return `<p style="margin:${margin};font-family:${F.sans};font-size:${
        emphasis ? 19 : 13
      }px;${letterSpacing}line-height:${lineHeight};color:${
        emphasis ? C.ink : C.mocha
      };">${inlineToHtml(content)}</p>`;
    })
    .join("");
}

/** Convert the admin plain-text shorthand into branded email HTML. */
export function emailPlainToHtml(text: string) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let panel: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push(emailText(inlineToHtml(paragraph.join(" "))));
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    blocks.push(emailList(list.map((item) => inlineToHtml(item))));
    list = [];
  }

  function flushPanel() {
    if (panel.length === 0) return;
    const first = panel[0] ?? "";
    const label = (first.startsWith("!") ? first.slice(1) : first).trim();
    const details = panel.slice(1).filter(Boolean);
    if (label) {
      blocks.push(emailPanel(`${emailPanelLabel(label)}${panelDetailsToHtml(details)}`));
    } else if (details.length > 0) {
      blocks.push(emailPanel(panelDetailsToHtml(details)));
    }
    panel = [];
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushPanel();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = (lines[index] ?? "").trim();

    if (!line) {
      flushAll();
      continue;
    }

    if (line.startsWith("```html")) {
      flushAll();
      const raw: string[] = [];
      let cursor = index + 1;
      while (cursor < lines.length && (lines[cursor] ?? "").trim() !== "```") {
        raw.push(lines[cursor] ?? "");
        cursor += 1;
      }
      const value = raw.join("\n").trim();
      if (value) blocks.push(value);
      index = cursor;
      continue;
    }

    if (line === "---") {
      flushAll();
      blocks.push(emailRule());
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      blocks.push(emailEyebrow(line.slice(3).trim()));
      continue;
    }

    if (line.startsWith("# ")) {
      flushAll();
      blocks.push(emailHeading(line.slice(2).trim()));
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushPanel();
      const item = line.slice(2).trim();
      if (item) list.push(item);
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      flushList();
      const emphasis = line.startsWith(">!");
      const content = line.slice(emphasis ? 2 : 1).trim();
      if (content) panel.push(`${emphasis ? "!" : ""}${content}`);
      continue;
    }

    const button = /^\[Button:\s*(.+?)\]\(([^)\s]+)\)$/i.exec(line);
    if (button) {
      flushAll();
      blocks.push(emailButton(safeHref(button[2] ?? ""), button[1] ?? ""));
      continue;
    }

    const small = /^_(?!_)(.+)_$/.exec(line);
    if (small) {
      flushAll();
      blocks.push(emailSmallText(inlineToHtml(small[1] ?? ""), "0"));
      continue;
    }

    if (/^\{\{[^{}]+\}\}$/.test(line)) {
      flushAll();
      blocks.push(line);
      continue;
    }

    flushList();
    flushPanel();
    paragraph.push(line);
  }

  flushAll();
  return blocks.filter(Boolean).join("\n");
}

