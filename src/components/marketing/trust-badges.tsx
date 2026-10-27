import { Award, Scissors, Shield, Truck } from "lucide-react";

import { TRUST_BADGES } from "@/lib/constants";

const icons = {
  award: Award,
  truck: Truck,
  scissors: Scissors,
  shield: Shield,
};

export function TrustBadges({ className }: { className?: string }) {
  return (
    <section className={className} aria-label="Why shop with us">
      <div className="container-luxe">
        <ul className="grid grid-cols-2 gap-6 border-y border-line py-8 lg:grid-cols-4">
          {TRUST_BADGES.map((badge) => {
            const Icon = icons[badge.icon];
            return (
              <li key={badge.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-espresso">
                    {badge.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-mocha">{badge.copy}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
