import { Landmark } from "lucide-react";

import type { StripePaymentMethodId } from "@/lib/payments/stripe-methods";
import { cn } from "@/lib/utils";

type BrandLogo = {
  src: string;
  width: number;
  height: number;
};

const CARD_BRANDS: BrandLogo[] = [
  { src: "/images/payments/visa.svg", width: 33, height: 20 },
  { src: "/images/payments/mastercard.svg", width: 26, height: 20 },
  { src: "/images/payments/amex.svg", width: 20, height: 20 },
  { src: "/images/payments/apple-pay.svg", width: 49, height: 20 },
  { src: "/images/payments/google-pay.svg", width: 53, height: 20 },
];

const METHOD_LOGOS: Partial<Record<StripePaymentMethodId, BrandLogo>> = {
  klarna: { src: "/images/payments/klarna.svg", width: 41, height: 20 },
  paypal: { src: "/images/payments/paypal.svg", width: 75, height: 20 },
  revolut_pay: { src: "/images/payments/revolut.svg", width: 91, height: 20 },
  amazon_pay: { src: "/images/payments/amazon-pay.svg", width: 104, height: 20 },
};

export function PaymentMethodBrand({
  method,
  className,
  logoClassName,
}: {
  method: StripePaymentMethodId;
  className?: string;
  logoClassName?: string;
}) {
  const logoSize = logoClassName ?? "h-5";

  if (method === "card") {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}
      >
        {CARD_BRANDS.map((brand) => (
          <img
            key={brand.src}
            src={brand.src}
            alt=""
            width={brand.width}
            height={brand.height}
            className={cn("w-auto max-w-full object-contain", logoSize)}
          />
        ))}
      </span>
    );
  }

  if (method === "pay_by_bank") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-center gap-1.5 text-[0.78rem] font-semibold tracking-tight text-espresso",
          className,
        )}
      >
        <Landmark className={cn("w-auto shrink-0 text-gold", logoSize)} />
        Pay by Bank
      </span>
    );
  }

  const logo = METHOD_LOGOS[method];
  if (!logo) return null;

  return (
    <span aria-hidden="true" className={cn("inline-flex items-center", className)}>
      <img
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        className={cn("w-auto max-w-full object-contain", logoSize)}
      />
    </span>
  );
}
