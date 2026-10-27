import type { BadgeTone } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-cream text-mocha",
  gold: "border-gold/40 bg-gold/15 text-[#8a6535]",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-amber-300/60 bg-amber-100 text-amber-800",
  danger: "border-danger/25 bg-danger/10 text-danger",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  outline: "border-ink/25 bg-transparent text-espresso",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
