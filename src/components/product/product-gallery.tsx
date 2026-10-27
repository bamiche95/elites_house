"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type GalleryImage = { url: string; alt: string };

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const gallery = images.length > 0 ? images : [{ url: "/images/product-p1.jpg", alt: name }];
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const go = (direction: 1 | -1) => {
    setIndex((current) => (current + direction + gallery.length) % gallery.length);
    setZoomed(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream">
        <button
          type="button"
          onClick={() => setZoomed((current) => !current)}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className={cn(
            "absolute inset-0 z-10 cursor-zoom-in",
            zoomed && "cursor-zoom-out",
          )}
        >
          <Image
            src={gallery[index].url}
            alt={gallery[index].alt}
            fill
            priority
            sizes="(max-width: 1024px) 92vw, 48vw"
            className={cn(
              "object-cover transition-transform duration-500",
              zoomed ? "scale-[1.6]" : "scale-100",
            )}
          />
        </button>

        {gallery.length > 1 ? (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 z-20 flex -translate-y-1/2 justify-between">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-espresso shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-espresso shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <span className="absolute bottom-3 right-3 z-20 bg-ink/70 px-2 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-ivory">
          {index + 1} / {gallery.length}
        </span>
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {gallery.map((image, imageIndex) => (
            <button
              key={`${image.url}-${imageIndex}`}
              type="button"
              onClick={() => {
                setIndex(imageIndex);
                setZoomed(false);
              }}
              aria-label={`View image ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={cn(
                "relative aspect-square overflow-hidden bg-cream ring-offset-2",
                imageIndex === index ? "ring-1 ring-ink" : "opacity-80 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
