"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, RotateCcw, Trash2 } from "lucide-react";

import { FieldHint, Label } from "@/components/ui/form";
import type { MediaFolder } from "@/lib/media/validate";
import { cn } from "@/lib/utils";

export type { MediaFolder };

/** Posts one image to the admin upload route and returns its public URL. */
export async function uploadMediaFile(file: File, folder: MediaFolder) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const response = await fetch("/api/admin/uploads", { method: "POST", body });
  const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Upload failed. Try again.");
  }

  return payload.url;
}

const ASPECTS = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
} as const;

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type ImageUploaderProps = {
  /** Hidden field read by the surrounding server action (e.g. `imageUrl`). */
  name: string;
  folder: MediaFolder;
  label?: string;
  hint?: string;
  defaultValue?: string | null;
  aspect?: keyof typeof ASPECTS;
  className?: string;
};

/**
 * Single-image picker that uploads immediately and keeps the resulting URL in a
 * hidden input, so existing `<form action={serverAction}>` forms work untouched.
 */
export function ImageUploader({
  name,
  folder,
  label = "Image",
  hint,
  defaultValue,
  aspect = "wide",
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setUrl(await uploadMediaFile(file, folder));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={fieldId}>{label}</Label>
      <input type="hidden" name={name} value={url} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "relative border border-dashed transition-colors",
          dragging ? "border-ink bg-white/70" : "border-line bg-white/40",
        )}
      >
        {url ? (
          <div className={cn("relative w-full overflow-hidden bg-cream", ASPECTS[aspect])}>
            <Image src={url} alt="" fill sizes="320px" className="object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 px-4 text-center",
              ASPECTS[aspect],
            )}
          >
            <ImagePlus className="h-5 w-5 text-mocha" />
            <span className="text-xs text-mocha">
              Drop an image here or <span className="underline underline-offset-4">browse</span>
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-mocha/70">
              JPG, PNG, WebP or AVIF
            </span>
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ivory/80">
            <Loader2 className="h-5 w-5 animate-spin text-espresso" />
            <span className="sr-only">Uploading</span>
          </div>
        ) : null}

        {url && !uploading ? (
          <div className="absolute right-2 top-2 z-10 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center bg-ivory/90 text-espresso hover:bg-ivory"
              aria-label="Replace image"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="flex h-7 w-7 items-center justify-center bg-ivory/90 text-danger hover:bg-ivory"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <details className="mt-2">
        <summary className="cursor-pointer text-[0.62rem] uppercase tracking-[0.14em] text-mocha">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3 w-3" /> Paste a URL instead
          </span>
        </summary>
        <input
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/images/hero.jpg or https://…"
          className="mt-2 w-full border border-line bg-white/70 px-3 py-2 font-mono text-xs text-espresso focus:border-ink focus:outline-none"
        />
      </details>

      {error ? (
        <p className="mt-1.5 text-xs leading-relaxed text-danger">{error}</p>
      ) : (
        <FieldHint>{hint}</FieldHint>
      )}
    </div>
  );
}
