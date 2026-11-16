#!/usr/bin/env node
/**
 * Verifies the admin media pipeline without touching the database.
 *
 *   npm run media:check
 *
 * 1. Resolves the storage adapter from the same env vars the app uses.
 * 2. Runs the magic-byte validator against valid and hostile samples.
 * 3. Round-trips a 1×1 PNG through the active store (Vercel Blob or disk).
 *
 * Exits non-zero on failure, so it is safe to run in CI.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(file);
  }
}

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const sample = (bytes: Uint8Array, name: string, type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const AVIF = new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`[media] ok   ${label}`);
  } else {
    failures += 1;
    console.error(`[media] FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

type Sniffer = (file: File) => Promise<{ ext: string }>;

async function expectAccepted(sniff: Sniffer, label: string, file: File, ext: string) {
  try {
    const result = await sniff(file);
    check(`${label} → ${result.ext}`, result.ext === ext, `expected ${ext}, got ${result.ext}`);
  } catch (error) {
    check(label, false, error instanceof Error ? error.message : String(error));
  }
}

async function expectRejected(sniff: Sniffer, label: string, file: File) {
  try {
    await sniff(file);
    check(label, false, "was accepted but should be rejected");
  } catch (error) {
    check(`${label} rejected (${error instanceof Error ? error.message : error})`, true);
  }
}

async function main() {
  const { MEDIA_FOLDERS, mediaMaxBytes, sniffImage } = await import("../src/lib/media/validate");
  const { MAX_PRODUCT_IMAGES, parseImageList, planImageChanges } = await import(
    "../src/lib/media/product-images"
  );

  console.log(`[media] folders: ${MEDIA_FOLDERS.join(", ")}`);
  console.log(`[media] per-file limit: ${mediaMaxBytes} bytes`);

  await expectAccepted(sniffImage, "PNG", sample(PNG_1X1, "photo.png"), "png");
  await expectAccepted(sniffImage, "JPEG header", sample(JPEG, "photo.jpg", "image/jpeg"), "jpg");
  await expectAccepted(sniffImage, "WebP header", sample(WEBP, "photo.webp", "image/webp"), "webp");
  await expectAccepted(sniffImage, "AVIF header", sample(AVIF, "photo.avif", "image/avif"), "avif");

  await expectRejected(
    sniffImage,
    "SVG",
    sample(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), "logo.svg", "image/svg+xml"),
  );
  await expectRejected(
    sniffImage,
    "renamed .exe",
    sample(new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0]), "not-an-image.jpg", "image/jpeg"),
  );
  await expectRejected(
    sniffImage,
    "oversized file",
    sample(new Uint8Array(mediaMaxBytes + 1024), "huge.png"),
  );

  // Gallery submission: JSON from the uploader, bad URLs filtered, duplicates dropped.
  const parsed = parseImageList(
    JSON.stringify([
      { url: "https://example.com/a.jpg", alt: "A" },
      { url: "/uploads/products/b.jpg" },
      { url: "javascript:alert(1)" },
      { url: "https://example.com/a.jpg" },
    ]),
  );
  check("parseImageList keeps 2 valid entries", parsed.length === 2, `got ${parsed.length}`);
  check(
    "parseImageList keeps order",
    parsed[0]?.url === "https://example.com/a.jpg" && parsed[1]?.url === "/uploads/products/b.jpg",
  );
  check(
    "parseImageList caps at the limit",
    parseImageList(
      JSON.stringify(
        Array.from({ length: MAX_PRODUCT_IMAGES + 3 }, (_, index) => ({
          url: `https://example.com/${index}.jpg`,
        })),
      ),
    ).length === MAX_PRODUCT_IMAGES,
  );

  const plan = planImageChanges(
    [
      { id: "img-a", url: "/uploads/products/a.jpg" },
      { id: "img-b", url: "/uploads/products/b.jpg" },
    ],
    [
      { id: "img-b", url: "/uploads/products/b.jpg", alt: "  Hero  " },
      { url: "https://example.com/new.jpg" },
    ],
    "Product name",
  );
  check(
    "planImageChanges updates the moved image",
    plan.update.length === 1 && plan.update[0]?.id === "img-b" && plan.update[0]?.position === 0,
  );
  check("planImageChanges trims the alt text", plan.update[0]?.alt === "Hero");
  check(
    "planImageChanges creates the new image at position 1",
    plan.create.length === 1 && plan.create[0]?.position === 1,
  );
  check("planImageChanges fills a blank alt with the product name", plan.create[0]?.alt === "Product name");
  check("planImageChanges removes the dropped image", plan.remove.length === 1 && plan.remove[0]?.id === "img-a");

  // A just-uploaded file has no row id yet — the URL must claim the existing row.
  const urlMatch = planImageChanges(
    [{ id: "img-c", url: "/uploads/products/fresh.png" }],
    [{ url: "/uploads/products/fresh.png", alt: "Fresh" }],
    "Product name",
  );
  check(
    "id-less entry adopts the existing row by URL",
    urlMatch.update.length === 1 && urlMatch.update[0]?.id === "img-c",
  );
  check(
    "URL match neither duplicates nor deletes the row",
    urlMatch.create.length === 0 && urlMatch.remove.length === 0,
  );

  const forced = (process.env.MEDIA_PROVIDER ?? "").toLowerCase();
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const provider =
    forced === "local" || forced === "vercel-blob" ? forced : token ? "vercel-blob" : "local";

  console.log(`[media] provider: ${provider}${token ? "" : " (no BLOB_READ_WRITE_TOKEN)"}`);

  if (provider === "local" && process.env.NODE_ENV === "production") {
    console.error("[media] FAIL production has no Blob token — uploads will be refused.");
    failures += 1;
  }

  try {
    if (provider === "vercel-blob") {
      if (!token) throw new Error("MEDIA_PROVIDER=vercel-blob but BLOB_READ_WRITE_TOKEN is empty.");
      const { del, put } = await import("@vercel/blob");
      const blob = await put(`healthcheck/${Date.now()}-${process.pid}.png`, sample(PNG_1X1, "check.png"), {
        access: "public",
        contentType: "image/png",
        token,
        addRandomSuffix: false,
      });
      console.log(`[media] uploaded ${blob.url}`);

      const response = await fetch(blob.url);
      check("Blob URL serves the image", response.ok, `status ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      check("Blob round-trip matches", bytes.length === PNG_1X1.length);

      await del(blob.url, { token });
      console.log("[media] deleted test blob");
    } else {
      const directory = path.join(process.cwd(), "public", "uploads", "healthcheck");
      const target = path.join(directory, `check-${Date.now()}.png`);
      await mkdir(directory, { recursive: true });
      await writeFile(target, PNG_1X1);
      const written = await readFile(target);
      check("disk write/read matches", written.length === PNG_1X1.length);
      console.log(`[media] wrote ${path.relative(process.cwd(), target)}`);
      await rm(directory, { recursive: true, force: true });
      console.log("[media] removed test folder");
    }
  } catch (error) {
    failures += 1;
    console.error("[media] FAIL storage round-trip —", error instanceof Error ? error.message : error);
  }

  if (failures > 0) {
    console.error(`\n[media] ${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log("\n[media] all checks passed.");
}

main().catch((error) => {
  console.error("[media] unexpected failure:", error);
  process.exit(1);
});
