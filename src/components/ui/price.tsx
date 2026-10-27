import { Star } from "lucide-react";

import { cn, discountPercent, formatMoney } from "@/lib/utils";

export function Price({
  pence,
  compareAtPence,
  className,
  size = "md",
}: {
  pence: number;
  compareAtPence?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  } as const;
  const discount = discountPercent(pence, compareAtPence);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-medium text-espresso", sizes[size])}>{formatMoney(pence)}</span>
      {discount > 0 && compareAtPence ? (
        <span className="text-xs text-mocha/70 line-through">{formatMoney(compareAtPence)}</span>
      ) : null}
      {discount > 0 ? (
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-danger">
          −{discount}%
        </span>
      ) : null}
    </span>
  );
}

export function RatingStars({
  rating,
  count,
  size = 14,
  className,
  showValue = false,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating * 10) / 10;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            width={size}
            height={size}
            className={
              index < Math.round(rating)
                ? "fill-gold text-gold"
                : "fill-transparent text-line"
            }
          />
        ))}
      </span>
      <span className="sr-only">{rounded} out of 5 stars</span>
      {showValue && rating > 0 ? (
        <span className="text-xs text-mocha">{rounded.toFixed(1)}</span>
      ) : null}
      {typeof count === "number" ? (
        <span className="text-xs text-mocha/80">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      ) : null}
    </span>
  );
}
