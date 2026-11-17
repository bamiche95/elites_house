#!/usr/bin/env node
/**
 * Verify the transactional-email mailbox, its DNS records, and send one live test message.
 *
 *   node scripts/email-check.mjs                  # verify login, send to ADMIN_NOTIFICATION_EMAIL
 *   node scripts/email-check.mjs you@example.com  # verify login, send to a chosen inbox
 *   node scripts/email-check.mjs --dns            # MX / SPF / DKIM / DMARC report (no SMTP)
 *
 * Reads EMAIL_PROVIDER / SMTP_* / EMAIL_FROM from `.env`, so it exercises exactly the
 * credentials the app uses. Exits non-zero when login, delivery or DNS is broken.
 */
import { promises as dns } from "node:dns";
import net from "node:net";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const nodemailer = require("nodemailer");

const envFile = ".env";
if (existsSync(envFile) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envFile);
}

const provider = (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase();
const host = process.env.SMTP_HOST ?? "";
const port = Number(process.env.SMTP_PORT ?? 465);
const secure = (process.env.SMTP_SECURE ?? "true") !== "false";
const user = process.env.SMTP_USER ?? "";
const pass = process.env.SMTP_PASSWORD ?? "";
const from = process.env.EMAIL_FROM ?? "";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@theeliteshouse.com";

const USAGE = `Usage: npm run email:check -- [options] [inbox]

  [inbox]    Recipient of the test message (default: ADMIN_NOTIFICATION_EMAIL)
  --dns      Report MX / SPF / DKIM / DMARC for the EMAIL_FROM domain (no SMTP traffic)
  --help     Show this message

Exit codes: 0 healthy, 1 login/delivery/DNS problem.`;

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}

const wantsDns = args.includes("--dns") || args.includes("--diagnose");
const to = args.find((arg) => !arg.startsWith("-")) ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? user;

const MARK = { ok: "✓", warn: "!", bad: "✗" };

function line(kind, label, message) {
  const text = `[email]   ${label.padEnd(12)} ${MARK[kind]} ${message}`;
  if (kind === "bad") console.error(text);
  else if (kind === "warn") console.warn(text);
  else console.log(text);
}

async function tryResolve(query, fallback = []) {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

const joined = (records) => records.map((chunks) => chunks.join(""));

/**
 * Holds a short SMTP conversation (greeting → EHLO → MAIL FROM → RCPT TO). The RCPT
 * verdict is what actually decides whether inbound mail for the domain is deliverable;
 * a host that accepts TCP but never greets will make senders time out.
 */
function probeSmtp(hostname, recipient, helo, timeout = 8_000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port: 25 });
    const commands = [`EHLO ${helo}`, `MAIL FROM:<postmaster@${helo}>`, `RCPT TO:<${recipient}>`, "QUIT"];
    let index = 0;
    let lastSent = -1;
    let greeted = false;
    let rcpt = "";
    let buffer = "";
    let settled = false;
    const timer = setTimeout(() => finish(greeted ? rcpt || "timeout" : "silent"), timeout);
    const finish = (verdict) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ greeted, verdict });
    };
    const sendNext = () => {
      if (index >= commands.length) return finish(rcpt);
      lastSent = index;
      socket.write(`${commands[index++]}\r\n`);
    };
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      let end = buffer.indexOf("\r\n");
      while (end !== -1) {
        const reply = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (/^\d{3} /.test(reply)) {
          if (lastSent === -1) greeted = reply.startsWith("220");
          else if (lastSent === 2) rcpt = reply;
          if (!greeted) return finish("silent");
          sendNext();
        }
        end = buffer.indexOf("\r\n");
      }
    });
    socket.on("error", (error) => finish(error.code || "unreachable"));
  });
}

function domainOf(address) {
  const angle = address.match(/<([^>]+)>/);
  const plain = (angle ? angle[1] : address ?? "").trim();
  return plain.includes("@") ? plain.split("@")[1].trim() : "";
}

const DKIM_SELECTORS = ["default", "mail", "dkim", "s1", "s2", "selector1", "selector2", "google"];

/**
 * Explains why mail flows (or does not) for the domain in EMAIL_FROM: MX decides
 * whether anything can be delivered TO the domain, SPF/DKIM/DMARC decide whether
 * what the app sends is trusted by Gmail, Outlook and friends.
 */
async function dnsReport() {
  const domain = domainOf(from) || domainOf(contactEmail);
  if (!domain) {
    console.error("[email] Cannot work out a domain — set EMAIL_FROM in .env.");
    return 1;
  }

  console.log(`[email] DNS report for ${domain}`);
  console.log(`[email]   EMAIL_FROM   ${from || "(unset)"}`);
  console.log(`[email]   SMTP_HOST    ${host || "(unset)"}`);

  const problems = [];

  const mx = (await tryResolve(() => dns.resolveMx(domain))).sort((a, b) => a.priority - b.priority);
  if (mx.length === 0) {
    problems.push("MX");
    const fallbackIps = await tryResolve(() => dns.resolve4(domain));
    line("bad", "MX", `no MX record — mail sent to @${domain} cannot be delivered`);
    if (fallbackIps.length > 0) {
      line(
        "warn",
        "A fallback",
        `${fallbackIps.join(", ")} — senders retry SMTP here, and this host has no mail service`,
      );
    }
  } else {
    line("ok", "MX", mx.map((record) => `${record.priority} ${record.exchange}`).join(", "));
    for (const record of mx) {
      const ips = await tryResolve(() => dns.resolve4(record.exchange));
      console.log(`[email]                ${record.exchange} → ${ips.join(", ") || "(no A record)"}`);
    }
  }

  const apexTxt = joined(await tryResolve(() => dns.resolveTxt(domain)));
  const spf = apexTxt.filter((value) => /^v=spf1\b/i.test(value));
  if (spf.length === 1) {
    line("ok", "SPF", spf[0]);
  } else if (spf.length === 0) {
    problems.push("SPF");
    line("bad", "SPF", `no TXT "v=spf1 …" at the apex — mail from @${domain} looks unauthenticated to receivers`);
  } else {
    problems.push("SPF");
    line("bad", "SPF", `${spf.length} records published — keep exactly one, merge them`);
  }

  let dkim = "";
  for (const selector of DKIM_SELECTORS) {
    const name = `${selector}._domainkey.${domain}`;
    const record = joined(await tryResolve(() => dns.resolveTxt(name))).find((value) =>
      /v=DKIM1/i.test(value),
    );
    if (record) {
      dkim = selector;
      line("ok", "DKIM", `${name} — ${record.slice(0, 56)}${record.length > 56 ? "…" : ""}`);
      break;
    }
  }
  if (!dkim) {
    problems.push("DKIM");
    line(
      "bad",
      "DKIM",
      `no v=DKIM1 record at ${DKIM_SELECTORS.slice(0, 3).join("/")}._domainkey — copy the selector and TXT from the mail host`,
    );
  }

  const dmarc = joined(await tryResolve(() => dns.resolveTxt(`_dmarc.${domain}`))).find((value) =>
    /^v=DMARC1/i.test(value),
  );
  if (dmarc) line("ok", "DMARC", dmarc);
  else line("warn", "DMARC", `missing — add TXT _dmarc = "v=DMARC1; p=none; rua=mailto:${contactEmail}"`);

  const mailIps = await tryResolve(() => dns.resolve4(`mail.${domain}`));
  const smtpIps = host ? await tryResolve(() => dns.resolve4(host)) : [];
  if (mailIps.length > 0 && smtpIps.length > 0) {
    if (mailIps.some((ip) => smtpIps.includes(ip))) {
      line("ok", "mail.", `mail.${domain} → ${mailIps.join(", ")}`);
    } else {
      problems.push(`mail.${domain}`);
      line(
        "bad",
        "mail.",
        `mail.${domain} → ${mailIps.join(", ")} — does not point at SMTP_HOST ${host} (${smtpIps.join(", ")}); mail apps using this name cannot connect`,
      );
    }
  }

  // Does each MX actually accept inbound mail for the support address? A host that
  // opens port 25 but never greets makes every delivery attempt time out instead.
  for (const record of mx) {
    const probe = await probeSmtp(record.exchange, contactEmail, domain);
    if (!probe.greeted) {
      problems.push("inbound");
      line(
        "bad",
        "inbound",
        `${record.exchange} opens port 25 but never sends an SMTP greeting — mail to @${domain} times out`,
      );
    } else if (/^2/.test(probe.verdict)) {
      line("ok", "inbound", `${record.exchange} accepts ${contactEmail}`);
    } else {
      problems.push("inbound");
      line("bad", "inbound", `${record.exchange} refused ${contactEmail}: ${probe.verdict}`);
    }
  }

  const ns = await tryResolve(() => dns.resolveNs(domain));
  console.log(`\n[email] Records to publish (DNS host: ${ns.join(", ") || "unknown"}):`);
  console.log(`[email]   MX    @                  <MX host(s) + priorities from your mail provider>`);
  console.log(`[email]   A     mail               ${smtpIps.join(", ") || "<SMTP_HOST address>"}`);
  console.log(`[email]   TXT   @                  v=spf1 a mx ip4:${smtpIps[0] ?? "<server IP>"} ~all`);
  console.log("[email]   TXT   default._domainkey <v=DKIM1 … copied from the mail host>");
  console.log(`[email]   TXT   _dmarc             v=DMARC1; p=none; rua=mailto:${contactEmail}`);
  console.log("[email] MX targets come from the mail provider — shared cPanel hosting receives through relay hosts");
  console.log("[email] (mx1-hosting.<provider> and friends). Use mail.<domain> only if it answers on port 25.");
  console.log("[email] SPF/DKIM strings are provider-specific — the host's “Email Deliverability” page lists the exact ones.");
  console.log("[email] If the registrar zone already holds these records, copy them here: they are inert while the domain's nameservers point elsewhere.");

  if (problems.length > 0) {
    console.error(`\n[email] ✗ DNS problems: ${problems.join(", ")}`);
    return 1;
  }

  console.log("\n[email] ✓ DNS looks healthy.");
  return 0;
}

if (wantsDns) {
  process.exit(await dnsReport());
}

if (provider !== "smtp") {
  console.error(`[email] EMAIL_PROVIDER is "${provider}" — set it to "smtp" to use the mailbox.`);
  process.exit(1);
}
if (!host || !user || !pass || !from) {
  console.error("[email] Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM in .env first.");
  process.exit(1);
}
if (!to) {
  console.error("[email] No recipient. Pass one: node scripts/email-check.mjs you@example.com");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
});

console.log(`[email] transport smtp://${user}@${host}:${port} (secure=${secure})`);

try {
  await transport.verify();
  console.log("[email] SMTP login OK");
} catch (error) {
  console.error("[email] SMTP login failed:", error.message);
  process.exit(1);
}

console.log(`[email] sending test message\n         from: ${from}\n         to:   ${to}`);

try {
  const info = await transport.sendMail({
    from,
    to,
    replyTo: contactEmail,
    subject: "SMTP test — The Elites House",
    text: `Transactional email is working.\n\nSent from ${from} at ${new Date().toISOString()}.\nReplies to this message go to ${contactEmail}.`,
    html: `<p>Transactional email is working.</p><p>Sent from <strong>${from}</strong> at ${new Date().toISOString()}.</p><p>Replies to this message go to <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>`,
  });

  const rejected = info.rejected ?? [];
  if (rejected.length > 0) {
    console.error("[email] rejected recipient(s):", rejected.join(", "));
    process.exit(1);
  }
  console.log("[email] accepted:", (info.accepted ?? []).join(", ") || "(none)");
  console.log("[email] messageId:", info.messageId);
  console.log("[email] done — check the inbox (and spam folder) for the test message.");
} catch (error) {
  console.error("[email] send failed:", error.message);
  process.exit(1);
} finally {
  transport.close();
}
