"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

import { uploadMediaFile, type MediaFolder } from "@/components/admin/image-uploader";
import { FieldHint, Label } from "@/components/ui/form";
import { MAX_PRODUCT_IMAGES } from "@/lib/media/product-images";
import { cn } from "@/lib/utils";

export type ManagedImage = { id?: string; url: string; alt: string };

type SaveInput = { productId: string; images: { id?: string; url: string; alt?: string }[] };
type SaveResult = { ok: boolean; error?: string };

type ProductImagesManagerProps = {
  mode: "create" | "edit";
  productName: string;
  productId?: string;
  initialImages?: { id: string; url: string; alt: string }[];
  folder?: MediaFolder;
  /** Persists the whole list; the edit page passes `saveProductImagesAction`. */
  saveAction?: (input: SaveInput) => Promise<SaveResult>;
};

const serialize = (images: ManagedImage[]) =>
  JSON.stringify(images.map((image) => ({ id: image.id ?? null, url: image.url, alt: image.alt })));

/**
 * Multi-image gallery editor.
 *
 * `edit` mode saves on every change through a server action; `create` mode keeps
 * the list in state and submits it as a hidden `imageUrls` JSON field so the
 * product does not exist yet. Order is the gallery order — index 0 is primary.
 */
export function ProductImagesManager({
  mode,
  productName,
  productId,
  initialImages = [],
  folder = "products",
  saveAction,
}: ProductImagesManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(serialize(initialImages));
  const [images, setImages] = useState<ManagedImage[]>(initialImages);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const remaining = MAX_PRODUCT_IMAGES - images.length;

  function persist(next: ManagedImage[]) {
    setImages(next);
    if (mode !== "edit" || !saveAction || !productId) return;

    const snapshot = serialize(next);
    if (snapshot === savedRef.current) return;

    const previous = savedRef.current;
    savedRef.current = snapshot;
    startTransition(async () => {
      const result = await saveAction({
        productId,
        images: next.map(({ id, url, alt }) => ({ id, url, alt })),
      });
      if (result.ok) {
        setError(null);
      } else {
        savedRef.current = previous;
        setError(result.error ?? "Could not save the gallery.");
      }
    });
  }

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, remaining);
    if (files.length === 0) return;

    setError(null);
    let next = images;

    for (const file of files) {
      setUploading((count) => count + 1);
      try {
        const url = await uploadMediaFile(file, folder);
        next = [...next, { url, alt: "" }];
        setImages(next);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      } finally {
        setUploading((count) => count - 1);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
    persist(next);
  }

  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    persist(next);
  }

  function makePrimary(index: number) {
    const primary = images[index];
    if (!primary || index === 0) return;
    persist([primary, ...images.filter((_, position) => position !== index)]);
  }

  function updateAlt(index: number, alt: string) {
    setImages(images.map((image, position) => (position === index ? { ...image, alt } : image)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{mode === "create" ? "Gallery images" : "Gallery"}</Label>
        <span className="text-[0.62rem] uppercase tracking-[0.14em] text-mocha">
          {pending ? "Saving…" : `${images.length} / ${MAX_PRODUCT_IMAGES}`}
        </span>
      </div>

      {mode === "create" ? (
        <input
          type="hidden"
          name="imageUrls"
          value={JSON.stringify(images.map(({ url, alt }) => ({ url, alt })))}
        />
      ) : null}

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="border border-line bg-white/50">
              <div className="relative aspect-square overflow-hidden bg-cream">
                <Image src={image.url} alt="" fill sizes="220px" className="object-cover" />
                {index === 0 ? (
                  <span className="absolute left-1.5 top-1.5 bg-ink px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.14em] text-ivory">
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-2">
                <input
                  value={image.alt}
                  onChange={(event) => updateAlt(index, event.target.value)}
                  onBlur={() => persist(images)}
                  placeholder={productName ? `Alt text — ${productName}` : "Alt text (optional)"}
                  aria-label={`Alt text for image ${index + 1}`}
                  className="w-full border border-line bg-white/70 px-2 py-1 text-xs text-espresso focus:border-ink focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-mocha">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move earlier"
                      className="p-1 hover:text-espresso disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label="Move later"
                      className="p-1 hover:text-espresso disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => makePrimary(index)}
                      disabled={index === 0}
                      aria-label="Make primary image"
                      className="p-1 hover:text-espresso disabled:opacity-30"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => persist(images.filter((_, position) => position !== index))}
                    aria-label="Remove image"
                    className="p-1 text-danger hover:opacity-70"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        disabled={remaining === 0}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 border border-dashed px-4 py-6 text-center transition-colors disabled:opacity-50",
          dragging ? "border-ink bg-white/70" : "border-line bg-white/40",
        )}
      >
        {uploading > 0 ? (
          <Loader2 className="h-4 w-4 animate-spin text-espresso" />
        ) : (
          <ImagePlus className="h-4 w-4 text-mocha" />
        )}
        <span className="text-xs text-mocha">
          {uploading > 0
            ? `Uploading ${uploading} image${uploading === 1 ? "" : "s"}…`
            : remaining === 0
              ? `Gallery full (${MAX_PRODUCT_IMAGES} images)`
              : "Add images — drop them here or browse"}
        </span>
        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-mocha/70">
          JPG, PNG, WebP or AVIF · 4 MB each
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => void addFiles(event.target.files)}
      />

      {error ? (
        <p className="text-xs leading-relaxed text-danger">{error}</p>
      ) : (
        <FieldHint>
          The first image is the primary shot used on cards, the cart and emails. Use the arrows or
          the star to reorder.
        </FieldHint>
      )}
    </div>
  );
}
