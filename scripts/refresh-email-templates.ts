#!/usr/bin/env node
/**
 * Refreshes the editable EmailTemplate copy shown in /admin/emails.
 *
 *   npm run emails:refresh
 *   npm run emails:refresh -- --subjects
 *
 * Safe to run against a live database: rows are matched by `name` and only the
 * body copy and description are refreshed, so wording an admin has edited in
 * the dashboard is preserved. Pass --subjects to also sync subject/preheader.
 *
 * This does not touch orders, products or any other store data — never run
 * `npm run db:seed` against production to refresh email copy.
 */
import { existsSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { emailTemplates } from "../src/lib/email/template-copy";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(file);
  }
}

const prisma = new PrismaClient();
const syncSubjects = process.argv.includes("--subjects");

async function main() {
  let created = 0;
  let updated = 0;

  for (const template of emailTemplates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: template.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          description: template.description,
          bodyHtml: template.bodyHtml,
          ...(syncSubjects
            ? { subject: template.subject, preheader: template.preheader }
            : {}),
        },
      });
      updated += 1;
    } else {
      await prisma.emailTemplate.create({ data: template });
      created += 1;
    }
  }

  console.log(
    `[emails] ${created} created, ${updated} refreshed${
      syncSubjects ? " (subject + preheader synced)" : ""
    }.`,
  );
}

main()
  .catch((error) => {
    console.error("[emails]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
