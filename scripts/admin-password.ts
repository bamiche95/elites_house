#!/usr/bin/env node
/**
 * Rotate the admin password (or create the account) straight against the
 * database, so a wrong or forgotten seed password never locks you out of `/admin`.
 *
 *   npm run admin:password                                   # prompts for email + password
 *   npm run admin:password -- --email you@domain.com         # prompts for the password
 *   npm run admin:password -- --email you@domain.com --password '...'
 *   npm run admin:password -- --email new@domain.com --password '...' --create
 *   npm run admin:password -- --email you@domain.com --password '...' --promote
 *
 * Hashes with bcrypt (cost 12, matching `api/auth/register`). Reads `.env.local`
 * / `.env` like the other scripts, so it targets whatever DATABASE_URL they hold.
 * Existing NextAuth JWTs stay valid until they expire — sign out and back in on
 * every device after rotating.
 */
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";

import { PrismaClient } from "@prisma/client";
import { compare, hash } from "bcryptjs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(file);
  }
}

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;
const DOCUMENTED_DEFAULT = "LushAdmin2026!";
const DEFAULT_NAME = "The Elites House Atelier";

const USAGE = `Usage: npm run admin:password -- [options]

  --email <address>   Account to rotate (default: SEED_ADMIN_EMAIL)
  --password <value>  New password (12+ characters); omit for a masked prompt
  --create            Create the account when the email is unknown
  --promote           Give an existing CUSTOMER account the ADMIN role
  --name <value>      Display name for --create
  --help              Show this message

Environment: DATABASE_URL (required), SEED_ADMIN_EMAIL (default email),
ADMIN_NEW_PASSWORD (default password, useful in CI).`;

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): Flags {
  const flags: Flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

const text = (flags: Flags, key: string) =>
  typeof flags[key] === "string" ? (flags[key] as string).trim() : "";

function fail(message: string) {
  console.error(`[admin] ✗ ${message}`);
}

function ok(message: string) {
  console.log(`[admin] ✓ ${message}`);
}

/** Prisma only accepts Postgres URLs; catch placeholders before we connect. */
function assertDatabaseUrl(): boolean {
  const url = (process.env.DATABASE_URL ?? "").trim();

  if (!url) {
    fail("DATABASE_URL is missing — add it to .env (Prisma reads the repo root).");
    return false;
  }

  if (!/^postgres(ql)?:\/\//i.test(url)) {
    // Never echo a value that could be a real credential.
    const preview = url.includes("@") ? "" : ` — got "${url.slice(0, 40)}"`;
    fail(
      `DATABASE_URL must start with postgresql://${preview}. ` +
        "Set it to the pooled URL from your database provider, or unset the shell variable so .env applies.",
    );
    return false;
  }

  return true;
}

/**
 * Prisma wraps driver failures in a code frame:
 *   Invalid `prisma.x()` invocation in
 *   D:\...\script.ts:12:34
 *     <indented source frame>
 *   <the actual cause>
 * Keep the cause and drop the wrapper, so a one-line failure stays one line.
 */
function summarisePrismaError(message: string): string {
  const kept: string[] = [];

  for (const line of message.trim().split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\s/.test(line)) continue; // source frame / stack
    if (/^(?:[→»>]\s*)?\d+\s{2,}\S/u.test(trimmed)) continue; // `→ 262   const …`
    if (/^Invalid `prisma\..*` invocation in$/i.test(trimmed)) continue;
    if (/^[A-Za-z]:[\\/].*:\d+:\d+$/.test(trimmed)) continue; // file:line:column
    if (/^Validation Error Count/i.test(trimmed)) continue;
    if (/^\d+$/.test(trimmed)) continue;
    kept.push(trimmed.replace(/^error:\s*/i, ""));
  }

  return kept.length > 0 ? kept.join(" ") : (message.trim().split(/\r?\n/)[0] ?? "").trim();
}

/** Plain prompt, used for the email address only. */
async function promptVisible(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/**
 * Reads a password without echoing it. Falls back to a visible prompt when the
 * terminal cannot be put in raw mode (IDE consoles, some Windows shells).
 */
async function promptHidden(question: string): Promise<string> {
  const stdin = process.stdin as typeof process.stdin & {
    setRawMode?: (mode: boolean) => void;
  };

  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    console.warn("[admin] ! Terminal cannot mask input — the password will be visible.");
    return promptVisible(question);
  }

  process.stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const finish = (result: string | Error) => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n" || char === "\u0004") {
          finish(value);
          return;
        }
        if (char === "\u0003") {
          finish(new Error("Cancelled."));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (char < " ") continue;

        value += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

/** Password values are used verbatim — no trimming — so spaces stay significant. */
function providedPassword(flags: Flags) {
  const fromFlag = flags.password;
  if (typeof fromFlag === "string" && fromFlag.trim()) return fromFlag;

  const fromEnv = process.env.ADMIN_NEW_PASSWORD;
  if (fromEnv && fromEnv.trim()) return fromEnv;

  return "";
}

async function readPassword(flags: Flags): Promise<string | null> {
  const provided = providedPassword(flags);
  if (provided) return provided;

  if (!process.stdin.isTTY) {
    fail("No password supplied. Pass --password or set ADMIN_NEW_PASSWORD.");
    return null;
  }

  const password = await promptHidden("New password: ");
  const confirmation = await promptHidden("Repeat password: ");
  if (password !== confirmation) {
    fail("The passwords do not match.");
    return null;
  }
  return password;
}

async function main(): Promise<number> {
  const flags = parseArgs(process.argv.slice(2));

  if (flags.help) {
    console.log(USAGE);
    return 0;
  }

  if (!assertDatabaseUrl()) return 1;

  let email = text(flags, "email") || (process.env.SEED_ADMIN_EMAIL ?? "").trim();
  if (!email) {
    if (!process.stdin.isTTY) {
      fail("No email supplied. Pass --email or set SEED_ADMIN_EMAIL.");
      return 1;
    }
    email = await promptVisible("Admin email: ");
  }
  email = email.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(`"${email}" is not a valid email address.`);
    return 1;
  }

  const password = await readPassword(flags);
  if (password === null) return 1;

  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Use at least ${MIN_PASSWORD_LENGTH} characters (got ${password.length}).`);
    return 1;
  }
  if (password === DOCUMENTED_DEFAULT) {
    fail("Refusing the seed default printed in the README — pick something else.");
    return 1;
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true, emailVerified: true },
    });

    if (!existing) {
      if (!flags.create) {
        fail(`No account for ${email}. Re-run with --create to add it.`);
        return 1;
      }

      const created = await prisma.user.create({
        data: {
          email,
          name: text(flags, "name") || DEFAULT_NAME,
          passwordHash: await hash(password, BCRYPT_ROUNDS),
          role: "ADMIN",
          emailVerified: new Date(),
          marketingOptIn: false,
        },
        select: { email: true, role: true },
      });
      ok(`Created ${created.email} with the ${created.role} role.`);
      console.log("[admin] Sign in at /login, then keep the password somewhere safe.");
      return 0;
    }

    if (existing.passwordHash && (await compare(password, existing.passwordHash))) {
      ok(`${email} already uses that password — nothing to change.`);
      return 0;
    }

    const promote = Boolean(flags.promote) && existing.role !== "ADMIN";
    if (existing.role !== "ADMIN" && !promote) {
      console.warn(
        `[admin] ! ${email} is a ${existing.role} account — add --promote to grant admin access.`,
      );
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: await hash(password, BCRYPT_ROUNDS),
        ...(promote ? { role: "ADMIN" as const } : {}),
        ...(existing.emailVerified ? {} : { emailVerified: new Date() }),
      },
    });

    ok(`Password updated for ${email}${promote ? " (now ADMIN)" : ` (${existing.role})`}.`);
    console.log("[admin] Existing sessions stay valid until they expire — sign out and back in.");
    return 0;
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    const detail = raw.trim();
    fail(/^Invalid `prisma\./.test(detail) ? summarisePrismaError(detail) : detail || raw);

    if (/P1001|can't reach database|timed out/i.test(raw)) {
      console.error("[admin] Check DATABASE_URL — remote databases need ?sslmode=require.");
    }
    if (/must start with the protocol/i.test(raw)) {
      console.error(
        "[admin] A DATABASE_URL exported in the shell overrides .env — unset it to use the local value.",
      );
    }
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

