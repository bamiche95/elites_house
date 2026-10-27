/**
 * Brand + storefront constants. Safe to import from client components
 * (only NEXT_PUBLIC_* values are referenced).
 */

export type BadgeTone =
  | "neutral"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "LushTresses",
  tagline: "Luxury human hair, crafted for every day",
  description:
    "LushTresses is a London hair atelier offering 100% Remy human hair bundles, HD lace wigs, closures and frontals — ethically sourced, double-drawn and ready to install.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lushtresses.com",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+44 20 7946 0958",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/lushtresses",
  addressLine: "Studio 4, 18 Portobello Road",
  city: "London",
  postcode: "W11 2DZ",
  country: "United Kingdom",
  hours: "Monday – Friday, 9am – 6pm (GMT)",
} as const;

export const mainNav = [
  { label: "Shop all", href: "/shop" },
  { label: "Bundles", href: "/shop/bundles" },
  { label: "Wigs", href: "/shop/wigs" },
  { label: "Closures", href: "/shop/closures" },
  { label: "Frontals", href: "/shop/frontals" },
  { label: "Accessories", href: "/shop/accessories" },
] as const;

export const footerNav = {
  shop: [
    { label: "All products", href: "/shop" },
    { label: "Bundle deals", href: "/shop/bundles" },
    { label: "HD lace wigs", href: "/shop/wigs" },
    { label: "Closures & frontals", href: "/shop/closures" },
    { label: "Hair accessories", href: "/shop/accessories" },
  ],
  help: [
    { label: "Contact us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Shipping & delivery", href: "/shipping" },
    { label: "Returns & exchanges", href: "/returns" },
    { label: "Payment options", href: "/payment-info" },
    { label: "Track your order", href: "/account/orders" },
  ],
  company: [
    { label: "Our story", href: "/about" },
    { label: "Hair care guide", href: "/hair-care" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
  ],
} as const;

export const FREE_SHIPPING_THRESHOLD_PENCE = 15000;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_QTY_PER_LINE = 10;

export const SHIPPING_METHODS = [
  {
    id: "STANDARD",
    label: "Standard tracked delivery",
    description: "Royal Mail Tracked 48 — signature required",
    estimate: "2 – 4 working days",
    pricePence: 495,
  },
  {
    id: "EXPRESS",
    label: "Express next-day delivery",
    description: "Order before 2pm for next working day (UK mainland)",
    estimate: "Next working day",
    pricePence: 995,
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export function getShippingMethod(id: string | undefined | null) {
  return SHIPPING_METHODS.find((method) => method.id === id) ?? SHIPPING_METHODS[0];
}

/** Standard shipping is free once the basket clears the threshold. */
export function shippingCostFor(methodId: string | undefined, subtotalPence: number) {
  const method = getShippingMethod(methodId);
  if (method.id === "STANDARD" && subtotalPence >= FREE_SHIPPING_THRESHOLD_PENCE) {
    return 0;
  }
  return method.pricePence;
}

export const TEXTURES = [
  { value: "BONE_STRAIGHT", label: "Bone straight" },
  { value: "BODY_WAVE", label: "Body wave" },
  { value: "DEEP_WAVE", label: "Deep wave" },
  { value: "LOOSE_WAVE", label: "Loose wave" },
  { value: "KINKY_CURLY", label: "Kinky curly" },
  { value: "NATURAL_WAVE", label: "Natural wave" },
] as const;

export const TEXTURE_LABELS: Record<string, string> = Object.fromEntries(
  TEXTURES.map((texture) => [texture.value, texture.label]),
);

export const LENGTH_OPTIONS = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest arrivals" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const ORDER_STATUS_META: Record<
  string,
  { label: string; tone: BadgeTone; description: string }
> = {
  PENDING: {
    label: "Pending",
    tone: "neutral",
    description: "Order received — awaiting payment.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    tone: "warning",
    description: "We're waiting for the payment provider to confirm this order.",
  },
  PAID: {
    label: "Paid",
    tone: "success",
    description: "Payment confirmed. Your order is queued for the atelier.",
  },
  PROCESSING: {
    label: "Processing",
    tone: "gold",
    description: "Your hair is being quality-checked and packed by hand.",
  },
  DISPATCHED: {
    label: "Dispatched",
    tone: "info",
    description: "On its way — track with the courier using the details below.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
    description: "Delivered. We'd love to hear how you styled it.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "danger",
    description: "This order was cancelled and the stock released.",
  },
  REFUNDED: {
    label: "Refunded",
    tone: "neutral",
    description: "The payment has been refunded to the original method.",
  },
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  AUTHORIZED: "Authorised",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  STRIPE: "Card / Apple Pay / Google Pay",
  PAYPAL: "PayPal",
  DEMO: "Demo payment",
};

export const TRUST_BADGES = [
  {
    icon: "award" as const,
    title: "100% Remy human hair",
    copy: "Cuticle-aligned, double-drawn and true to length.",
  },
  {
    icon: "truck" as const,
    title: "Free tracked UK delivery",
    copy: `On orders over £${FREE_SHIPPING_THRESHOLD_PENCE / 100}.`,
  },
  {
    icon: "scissors" as const,
    title: "Atelier quality control",
    copy: "Every bundle hand-checked before it leaves the studio.",
  },
  {
    icon: "shield" as const,
    title: "Secure payments",
    copy: "Stripe & PayPal with 3-D Secure where required.",
  },
];

export const HAIR_CARE_STEPS = [
  {
    step: "01",
    title: "Cleanse gently",
    copy: "Co-wash with a sulphate-free conditioner every 8–10 wears. Detangle from the ends up with a wide-tooth comb.",
  },
  {
    step: "02",
    title: "Hydrate deeply",
    copy: "Apply a moisture mask weekly, concentrating on mid-lengths and ends. Rinse with cool water to seal the cuticle.",
  },
  {
    step: "03",
    title: "Protect at night",
    copy: "Braid loosely, then wrap in silk or satin. This is the single biggest lever for longevity.",
  },
  {
    step: "04",
    title: "Heat with care",
    copy: "Always use a heat protectant. Keep styling tools below 180°C on curly textures and 200°C on straight.",
  },
];
