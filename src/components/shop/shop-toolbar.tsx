"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { SORT_OPTIONS, TEXTURES } from "@/lib/constants";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("sort") ?? "featured";

  return (
    <label className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          if (event.target.value === "featured") next.delete("sort");
          else next.set("sort", event.target.value);
          next.delete("page");
          const query = next.toString();
          router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
        className="h-10 border border-line bg-transparent px-2 pr-6 text-[0.68rem] uppercase tracking-[0.12em] text-espresso focus:border-ink focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const entries: Array<{ key: string; label: string }> = [];
  const texture = searchParams.get("texture");
  if (texture) {
    const label = TEXTURES.find((item) => item.value === texture)?.label ?? texture;
    entries.push({ key: "texture", label });
  }
  const length = searchParams.get("length");
  if (length) entries.push({ key: "length", label: `${length}"` });
  if (searchParams.get("minPrice") || searchParams.get("maxPrice")) {
    entries.push({ key: "price", label: "Price filter" });
  }
  const q = searchParams.get("q");
  if (q) entries.push({ key: "q", label: `“${q}”` });

  if (entries.length === 0) return null;

  const remove = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "price") {
      next.delete("minPrice");
      next.delete("maxPrice");
    } else {
      next.delete(key);
    }
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map((entry) => (
        <button
          key={entry.key}
          type="button"
          onClick={() => remove(entry.key)}
          className="inline-flex items-center gap-1.5 border border-line bg-cream px-2.5 py-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-espresso"
        >
          {entry.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
