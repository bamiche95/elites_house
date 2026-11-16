import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";

import { env } from "@/lib/env";
import { sniffImage, type MediaFolder } from "@/lib/media/validate";

/**
 * Production uploads go to Vercel Blob (`BLOB_READ_WRITE_TOKEN` is injected when
 * the Blob store is connected to the project). Without a token — local dev or a
 * fresh clone — files land in `public/uploads/` so the admin still works.
 * `MEDIA_PROVIDER=local` forces the disk adapter even when a token exists.
 */
export const mediaProvider: "vercel-blob" | "local" =
  env.mediaProvider === "local" || env.mediaProvider === "vercel-blob"
    ? env.mediaProvider
    : env.blobReadWriteToken
      ? "vercel-blob"
      : "local";

/** Serverless filesystems are read-only, so the disk fallback is dev-only. */
export const isMediaConfigured =
  mediaProvider === "vercel-blob" || process.env.NODE_ENV !== "production";

export const mediaUnavailableMessage =
  "Image storage is not configured. Add a Vercel Blob store (BLOB_READ_WRITE_TOKEN) to this project.";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

export type UploadResult = { url: string; provider: "vercel-blob" | "local" };

export async function uploadImage(file: File, folder: MediaFolder): Promise<UploadResult> {
  if (!isMediaConfigured) throw new Error(mediaUnavailableMessage);

  const { ext, mime } = await sniffImage(file);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const key = `${folder}/${filename}`;

  if (mediaProvider === "vercel-blob") {
    const blob = await put(key, file, {
      access: "public",
      contentType: mime,
      token: env.blobReadWriteToken,
      addRandomSuffix: false,
    });
    return { url: blob.url, provider: "vercel-blob" };
  }

  const directory = path.join(UPLOAD_ROOT, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${folder}/${filename}`, provider: "local" };
}

/**
 * Best-effort removal of an uploaded asset. Pasted external URLs (Unsplash,
 * Cloudinary, the seeded `/images/*` art) are left alone, and a failure is only
 * logged — a stale file must never block saving a product.
 */
export async function deleteImage(url?: string | null): Promise<void> {
  if (!url) return;

  try {
    if (BLOB_HOST.test(url) && env.blobReadWriteToken) {
      await del(url, { token: env.blobReadWriteToken });
      return;
    }

    if (url.startsWith("/uploads/")) {
      const target = path.resolve(UPLOAD_ROOT, url.replace(/^\/uploads\//, ""));
      if (!target.startsWith(UPLOAD_ROOT)) return;
      await unlink(target).catch(() => undefined);
    }
  } catch (error) {
    console.warn("[media] could not delete asset:", error instanceof Error ? error.message : error);
  }
}
