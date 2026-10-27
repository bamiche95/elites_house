import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ivory hover:bg-espresso",
  gold: "bg-gold text-ink hover:bg-gold-soft",
  outline: "border border-line bg-transparent text-espresso hover:border-ink hover:bg-cream",
  ghost: "text-espresso hover:bg-cream",
  danger: "bg-danger text-white hover:bg-danger/90",
  subtle: "bg-cream text-espresso hover:bg-sand",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4",
  md: "h-12 px-6",
  lg: "h-14 px-9",
  icon: "h-10 w-10",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props} />
  );
}

export type ButtonLinkProps = React.ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
