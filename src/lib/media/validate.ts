/**
 * Image upload rules shared by the upload route and the storage adapter.
 *
 * The browser-declared MIME type is never trusted: a renamed executable, an SVG
 * (stored-XSS vector) or a mislabelled file must be rejected before the bytes
 * ever reach the CDN. Detection reads the magic number instead.
 */
import { env } from "@/lib/env";

const FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Per-file ceiling. Vercel caps a serverless request body at ~4.5 MB, so the
 * client uploads one file per request and this stays below that limit.
 */
export const mediaMaxBytes =
  Number.isFinite(env.mediaMaxBytes) && env.mediaMaxBytes > 0
    ? env.mediaMaxBytes
    : FALLBACK_MAX_BYTES;

/** Folders exposed by the admin uploader; keeps uploaded keys namespaced. */
export const MEDIA_FOLDERS = ["products", "banners", "pages", "testimonials"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export function isMediaFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value);
}

export type SniffedImage = { mime: string; ext: "jpg" | "png" | "webp" | "avif" };

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

export async function sniffImage(file: File): Promise<SniffedImage> {
  if (file.size === 0) throw new Error("That file is empty — choose an image.");

  if (file.size > mediaMaxBytes) {
    const limit = Math.max(1, Math.round(mediaMaxBytes / (1024 * 1024)));
    throw new Error(`Images must be ${limit} MB or smaller.`);
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  if (ascii(head, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(head, 8, 12))) {
    return { mime: "image/avif", ext: "avif" };
  }

  throw new Error("Unsupported image. Use a JPG, PNG, WebP or AVIF file.");
}

/** Formats a byte count for admin-facing copy. */
export function formatMegabytes(bytes: number) {
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}
