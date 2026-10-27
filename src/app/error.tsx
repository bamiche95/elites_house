"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="container-luxe py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl text-espresso">
        We hit a snag loading this page
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mocha">
        Please try again. If it keeps happening, contact the atelier and we&apos;ll sort it out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center border border-line px-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-espresso"
        >
          Back to home
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 text-[0.65rem] uppercase tracking-[0.16em] text-mocha/70">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
