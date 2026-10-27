"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Lock, Truck } from "lucide-react";
import { useState } from "react";

import { AddressFields } from "@/components/checkout/address-fields";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentStage } from "@/components/checkout/payment-stage";
import {
  emptyAddress,
  type AddressState,
  type PaymentMode,
  type StartResponse,
} from "@/components/checkout/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/lib/cart-store";
import { SHIPPING_METHODS, shippingCostFor } from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";

export type CheckoutFlowProps = {
  initialEmail: string;
  initialName: string;
  initialPhone: string;
  initialAddress: AddressState | null;
  methods: { stripe: boolean; paypal: boolean; demo: boolean };
  stripePublishableKey: string;
  paypalClientId: string;
  isAuthenticated: boolean;
};

export function CheckoutFlow({
  initialEmail,
  initialName,
  initialPhone,
  initialAddress,
  methods,
  paypalClientId,
  isAuthenticated,
}: CheckoutFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const clearCart = useCartStore((state) => state.clear);

  const defaultMode: PaymentMode = methods.stripe
    ? "STRIPE"
    : methods.paypal
      ? "PAYPAL"
      : "DEMO";

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState(initialEmail);
  const [shipping, setShipping] = useState<AddressState>(
    initialAddress ?? { ...emptyAddress, fullName: initialName, phone: initialPhone },
  );
  const [method, setMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [mode, setMode] = useState<PaymentMode>(defaultMode);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    message: string;
    discountPence: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [session, setSession] = useState<StartResponse | null>(null);
  const [placed, setPlaced] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const subtotalPence = items.reduce((total, line) => total + line.pricePence * line.quantity, 0);
  const shippingPence = shippingCostFor(method, subtotalPence);
  const discountPence = coupon?.discountPence ?? 0;
  const totalPence = Math.max(0, subtotalPence - discountPence + shippingPence);
  const paymentsAvailable = methods.stripe || methods.paypal || methods.demo;

  function validate() {
    const next: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (shipping.fullName.trim().length < 2) next.fullName = "Enter the recipient's name.";
    if (shipping.phone.trim().length < 7) next.phone = "Enter a contact number.";
    if (shipping.line1.trim().length < 3) next.line1 = "Enter the first address line.";
    if (shipping.city.trim().length < 2) next.city = "Enter a town or city.";
    if (shipping.postcode.trim().length < 3) next.postcode = "Enter a postcode.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function applyCoupon() {
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalPence }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        discountPence?: number;
        coupon?: { code: string };
      };
      if (!response.ok || !data.ok || !data.coupon) {
        throw new Error(data.error ?? "That code isn't valid.");
      }
      setCoupon({
        code: data.coupon.code,
        message: data.message ?? "Discount applied.",
        discountPence: data.discountPence ?? 0,
      });
      setCouponInput("");
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "That code isn't valid.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponError(null);
    setCouponInput("");
  }

  async function startPayment() {
    if (!validate()) {
      setStartError("Please check the highlighted fields.");
      return;
    }
    if (items.length === 0) {
      setStartError("Your bag is empty.");
      return;
    }

    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: mode,
          checkout: {
            email: email.trim(),
            name: shipping.fullName.trim(),
            phone: shipping.phone.trim(),
            items: items.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
            shippingAddress: shipping,
            billingSameAsShipping: true,
            shippingMethod: method,
            couponCode: coupon?.code,
            notes: notes.trim() || undefined,
          },
        }),
      });
      const data = (await response.json()) as StartResponse;
      if (!response.ok) throw new Error(data.error ?? "We couldn't start your payment.");

      setSession(data);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStartError(
        error instanceof Error
          ? error.message
          : "We couldn't start your payment. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  }

  function finish(orderNumber: string) {
    setPlaced(true);
    clearCart();
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  }

  async function confirmDemo() {
    if (!session) return;
    setDemoLoading(true);
    setDemoError(null);
    try {
      const response = await fetch("/api/checkout/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: session.orderNumber }),
      });
      const data = (await response.json()) as { error?: string; orderNumber?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't place the test order.");
      toast({
        title: "Order placed",
        description: `Order ${data.orderNumber ?? session.orderNumber} is confirmed.`,
      });
      finish(data.orderNumber ?? session.orderNumber);
    } catch (error) {
      setDemoError(
        error instanceof Error ? error.message : "We couldn't place the test order.",
      );
    } finally {
      setDemoLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr]">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-cream" />
          <div className="h-64 bg-cream" />
        </div>
        <div className="h-72 animate-pulse bg-cream" />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl text-espresso">Order confirmed</p>
        <p className="mt-2 text-sm text-mocha">Taking you to your confirmation…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line bg-cream px-6 py-20 text-center">
        <p className="font-display text-3xl text-espresso">Your bag is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">
          Add a piece to your bag before heading to checkout.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-12 items-center justify-center bg-ink px-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ivory"
        >
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
      <div>
        <ol className="mb-8 flex flex-wrap items-center gap-3">
          {[
            { number: 1, label: "Details & delivery" },
            { number: 2, label: "Payment" },
          ].map((item, index) => (
            <li key={item.number} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[0.68rem]",
                  step >= item.number
                    ? "border-ink bg-ink text-ivory"
                    : "border-line text-mocha",
                )}
              >
                {step > item.number ? <Check className="h-3.5 w-3.5" /> : `0${item.number}`}
              </span>
              <span
                className={cn(
                  "text-[0.62rem] uppercase tracking-[0.18em]",
                  step >= item.number ? "text-espresso" : "text-mocha",
                )}
              >
                {item.label}
              </span>
              {index === 0 ? <span className="h-px w-8 bg-line" /> : null}
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <div className="space-y-8">
            {!isAuthenticated ? (
              <div className="border border-line bg-cream px-4 py-3 text-xs leading-relaxed text-mocha">
                Checking out as a guest? You can set a password from your confirmation email.{" "}
                <Link
                  href="/login?callbackUrl=/checkout"
                  className="underline underline-offset-2 hover:text-espresso"
                >
                  Sign in
                </Link>{" "}
                to use saved details.
              </div>
            ) : null}

            <section>
              <h2 className="font-display text-2xl text-espresso">Contact</h2>
              <div className="mt-4">
                <Field label="Email address" htmlFor="email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-espresso">Delivery address</h2>
              <div className="mt-4">
                <AddressFields
                  value={shipping}
                  onChange={(patch) => setShipping((current) => ({ ...current, ...patch }))}
                  errors={errors}
                />
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-espresso">Delivery method</h2>
              <div className="mt-4 space-y-2">
                {SHIPPING_METHODS.map((option) => {
                  const price =
                    option.id === "STANDARD" && subtotalPence >= 15000 ? 0 : option.pricePence;
                  const active = method === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
                        active ? "border-ink bg-cream" : "border-line",
                      )}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={active}
                        onChange={() => setMethod(option.id)}
                        className="mt-1 accent-ink"
                      />
                      <span className="flex-1">
                        <span className="flex items-center justify-between gap-3 text-sm text-espresso">
                          <span className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gold" />
                            {option.label}
                          </span>
                          <span>{price === 0 ? "Free" : formatMoney(price)}</span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-mocha">
                          {option.description} · {option.estimate}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl text-espresso">Payment method</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    id: "STRIPE" as const,
                    label: "Card / Apple Pay",
                    description: "Visa, Mastercard, Amex",
                    enabled: methods.stripe,
                  },
                  {
                    id: "PAYPAL" as const,
                    label: "PayPal",
                    description: "Pay with PayPal",
                    enabled: methods.paypal,
                  },
                  {
                    id: "DEMO" as const,
                    label: "Test payment",
                    description: "Development only",
                    enabled: methods.demo,
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 border px-4 py-3",
                      mode === option.id && option.enabled
                        ? "border-ink bg-cream"
                        : "border-line",
                      !option.enabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={mode === option.id}
                      disabled={!option.enabled}
                      onChange={() => setMode(option.id)}
                    />
                    <span className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.12em] text-espresso">
                      <CreditCard className="h-3.5 w-3.5 text-gold" />
                      {option.label}
                    </span>
                    <span className="text-[0.65rem] text-mocha">{option.description}</span>
                  </label>
                ))}
              </div>
              {!paymentsAvailable ? (
                <p className="mt-3 border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
                  No payment provider is configured. Add Stripe or PayPal keys to enable
                  checkout.
                </p>
              ) : null}
            </section>

            <section>
              <h2 className="font-display text-2xl text-espresso">
                Order notes <span className="text-sm text-mocha">(optional)</span>
              </h2>
              <div className="mt-4">
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  placeholder="Gift note, delivery instructions, or a note for your stylist."
                />
              </div>
            </section>

            {startError ? (
              <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
                {startError}
              </p>
            ) : null}

            <Button
              onClick={startPayment}
              size="lg"
              className="w-full"
              disabled={starting || !paymentsAvailable}
            >
              {starting
                ? "Starting secure payment…"
                : `Continue to payment · ${formatMoney(totalPence)}`}
            </Button>
            <p className="flex items-center justify-center gap-2 text-[0.65rem] text-mocha">
              <Lock className="h-3 w-3" /> Secured by Stripe &amp; PayPal · We never store card
              details
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to details
            </button>

            <div>
              <p className="eyebrow">Step two</p>
              <h2 className="mt-2 font-display text-3xl text-espresso">
                Complete your payment
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                Your order is reserved while you pay. Unpaid orders release their stock after
                two hours.
              </p>
            </div>

            {session ? (
              <PaymentStage
                session={session}
                mode={mode}
                paypalClientId={paypalClientId}
                totalPence={totalPence}
                onPaid={() => finish(session.orderNumber)}
                onDemoPaid={confirmDemo}
                demoLoading={demoLoading}
                demoError={demoError}
              />
            ) : null}
          </div>
        )}
      </div>

      <CheckoutSummary
        items={items}
        subtotalPence={subtotalPence}
        discountPence={discountPence}
        shippingPence={shippingPence}
        totalPence={totalPence}
        couponCode={coupon?.code}
        couponMessage={coupon?.message}
        couponError={couponError}
        couponInput={couponInput}
        onCouponInput={setCouponInput}
        onApplyCoupon={applyCoupon}
        onRemoveCoupon={removeCoupon}
        applying={applyingCoupon}
      />
    </div>
  );
}



