"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Overlay } from "@/components/ui/overlay";
import { formatMoney } from "@/lib/utils";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  pricePence: number;
  imageUrl: string | null;
  category: string;
};

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { products: SearchResult[] };
        setResults(data.products ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  return (
    <Overlay open={open} onClose={onClose} title="Search LushTresses">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-3 border border-line bg-white/70 px-3">
          <Search className="h-4 w-4 text-mocha" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bundles, wigs, closures…"
            aria-label="Search products"
            className="h-11 w-full bg-transparent text-sm text-espresso placeholder:text-mocha/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="py-6 text-center text-xs uppercase tracking-[0.18em] text-mocha">
            Searching…
          </p>
        ) : null}

        {!loading && query.trim().length >= 2 && results.length === 0 ? (
          <p className="py-6 text-center text-sm text-mocha">
            No matches for “{query}”. Try “body wave” or “wig”.
          </p>
        ) : null}

        {!loading && query.trim().length < 2 ? (
          <div className="space-y-3">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-mocha">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {["Bone straight", "Body wave", "HD lace wig", "Closure", "Bundle deal"].map(
                (term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="border border-line px-3 py-1.5 text-xs text-mocha transition-colors hover:border-ink hover:text-espresso"
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}

        <ul className="mt-2 divide-y divide-line">
          {results.map((result) => (
            <li key={result.id}>
              <Link
                href={`/product/${result.slug}`}
                onClick={onClose}
                className="flex items-center gap-4 py-3"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-cream">
                  <Image
                    src={result.imageUrl || "/images/product-p1.jpg"}
                    alt={result.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight text-espresso">
                    {result.name}
                  </p>
                  <p className="text-xs text-mocha">{result.category}</p>
                </div>
                <span className="text-sm text-espresso">{formatMoney(result.pricePence)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {results.length > 0 ? (
          <Link
            href={`/shop?q=${encodeURIComponent(query.trim())}`}
            onClick={onClose}
            className="mt-4 block border border-line py-3 text-center text-[0.68rem] uppercase tracking-[0.18em] text-espresso hover:border-ink"
          >
            View all results
          </Link>
        ) : null}
      </div>
    </Overlay>
  );
}
