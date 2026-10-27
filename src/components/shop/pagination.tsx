import Link from "next/link";

import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={makeHref(page - 1)}
          className="border border-line px-3 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:border-ink hover:text-espresso"
        >
          Prev
        </Link>
      ) : null}

      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const showGap = previous && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-2">
            {showGap ? <span className="text-xs text-mocha">…</span> : null}
            <Link
              href={makeHref(candidate)}
              aria-current={candidate === page ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center border text-xs",
                candidate === page
                  ? "border-ink bg-ink text-ivory"
                  : "border-line text-mocha hover:border-ink hover:text-espresso",
              )}
            >
              {candidate}
            </Link>
          </span>
        );
      })}

      {page < totalPages ? (
        <Link
          href={makeHref(page + 1)}
          className="border border-line px-3 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:border-ink hover:text-espresso"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
