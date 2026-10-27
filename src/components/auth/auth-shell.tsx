import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  image = "/images/collection-wigs.jpg",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  image?: string;
}) {
  return (
    <div className="container-luxe grid gap-12 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-espresso">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mocha">{description}</p>
        <div className="mt-8">{children}</div>
      </div>

      <div className="relative hidden aspect-[4/5] overflow-hidden bg-cream lg:block">
        <Image
          src={image}
          alt="LushTresses atelier"
          fill
          priority
          sizes="46vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold-soft">
            The atelier
          </p>
          <p className="mt-3 max-w-sm font-display text-2xl leading-snug">
            &ldquo;Hair that behaves like your own — that&apos;s the whole brief.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
