#!/usr/bin/env node
/**
 * Verify the transactional-email mailbox and send one live test message.
 *
 *   node scripts/email-check.mjs                  # verify login, send to ADMIN_NOTIFICATION_EMAIL
 *   node scripts/email-check.mjs you@example.com  # verify login, send to a chosen inbox
 *
 * Reads EMAIL_PROVIDER / SMTP_* / EMAIL_FROM from `.env`, so it exercises exactly the
 * credentials the app uses. Exits non-zero when login or delivery fails.
 */
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
const to = process.argv[2] ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? user;

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
