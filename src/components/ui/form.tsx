import type * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-none border border-line bg-white/70 px-4 py-3 font-sans text-sm text-espresso placeholder:text-mocha/50 transition-colors focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70";

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn(
        "mb-2 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mocha",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentPropsWithoutRef<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(fieldBase, "h-12 appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs leading-relaxed text-danger">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs leading-relaxed text-mocha">{children}</p>;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
      <FieldHint>{hint}</FieldHint>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  id,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & { label: React.ReactNode }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mocha",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
