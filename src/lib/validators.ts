import { z } from "zod";

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Passwords can be at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const emailField = z
  .string()
  .min(1, "Email address is required")
  .max(254, "That email address is too long")
  .email("Enter a valid email address");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  email: emailField,
  password: passwordField,
  marketingOptIn: z.boolean().optional().default(true),
});

export const guestSetupSchema = z.object({
  token: z.string().min(10, "This setup link is invalid"),
  name: z.string().max(80).optional(),
  password: passwordField,
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().optional(),
  password: passwordField,
});

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export const cartSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your bag is empty").max(40),
});

export const addressSchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(2, "Enter the recipient's full name").max(80),
  phone: z
    .string()
    .min(7, "Enter a contact number")
    .max(24)
    .regex(/^[+()\d\s-]+$/, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter the first line of the address").max(120),
  line2: z.string().max(120).optional(),
  city: z.string().min(2, "Enter a town or city").max(80),
  county: z.string().max(80).optional(),
  postcode: z.string().min(3, "Enter a postcode or ZIP").max(12),
  country: z.string().min(2).max(2).default("GB"),
});

export const shippingMethodSchema = z.enum(["STANDARD", "EXPRESS"]);

export const checkoutSchema = z.object({
  email: emailField,
  name: z.string().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .min(7, "Enter a contact number")
    .max(24)
    .regex(/^[+()\d\s-]+$/, "Enter a valid phone number"),
  items: z.array(cartLineSchema).min(1, "Your bag is empty").max(40),
  shippingAddress: addressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: addressSchema.optional(),
  shippingMethod: shippingMethodSchema.default("STANDARD"),
  couponCode: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
});

export const couponApplySchema = z.object({
  code: z.string().min(2, "Enter a discount code").max(40),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  authorName: z.string().min(2, "Enter your name").max(60),
  authorEmail: emailField.optional().or(z.literal("")),
  title: z.string().max(90).optional(),
  body: z.string().min(20, "Tell us a little more (20+ characters)").max(1500),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name").max(80),
  email: emailField,
  phone: z.string().max(24).optional(),
  subject: z.string().min(3, "Choose a subject").max(120),
  message: z.string().min(20, "Tell us a little more (20+ characters)").max(2000),
});

export const newsletterSchema = z.object({
  email: emailField,
  source: z.string().max(40).optional().default("footer"),
});

export const postcodeSchema = z
  .string()
  .min(3, "Enter a postcode")
  .max(10)
  .regex(/^[A-Za-z0-9\s]+$/, "Enter a valid postcode");

export const unsubscribeSchema = z.object({
  token: z.string().min(6),
});

// ───────────────────────────── Admin forms ─────────────────────────────

export const orderStatusValues = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const adminOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues),
  trackingNumber: z.string().max(60).optional(),
  trackingCarrier: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  notifyCustomer: z.coerce.boolean().default(true),
});

export const productFormSchema = z.object({
  name: z.string().min(2, "Product name is required").max(120),
  slug: z.string().max(120).optional(),
  subtitle: z.string().max(160).optional(),
  description: z.string().min(20, "Add a description of at least 20 characters"),
  details: z.string().max(4000).optional(),
  categoryId: z.string().min(1, "Choose a category"),
  texture: z.enum([
    "BONE_STRAIGHT",
    "BODY_WAVE",
    "DEEP_WAVE",
    "LOOSE_WAVE",
    "KINKY_CURLY",
    "NATURAL_WAVE",
  ]),
  color: z.string().min(2).max(60).default("Natural Black"),
  basePricePence: z.coerce.number().int().min(0).max(10_000_000),
  compareAtPricePence: z.coerce.number().int().min(0).max(10_000_000).optional(),
  stock: z.coerce.number().int().min(0).max(100_000),
  lengthInches: z.coerce.number().int().min(0).max(60).optional(),
  imageUrl: z.string().max(500).optional(),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  isBestSeller: z.coerce.boolean().default(false),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const variantUpdateSchema = z.object({
  variantId: z.string().min(1),
  pricePence: z.coerce.number().int().min(0).max(10_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
  isActive: z.coerce.boolean().default(true),
});

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Title is required").max(120),
  subtitle: z.string().max(160).optional(),
  body: z.string().max(400).optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaHref: z.string().max(200).optional(),
  imageUrl: z.string().max(500).optional(),
  badge: z.string().max(40).optional(),
  placement: z.enum(["ANNOUNCEMENT", "HOME_HERO", "HOME_PROMO", "SHOP_HERO"]),
  position: z.coerce.number().int().min(0).max(99).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const pageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2).max(120),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(10, "Add some content"),
  heroImage: z.string().max(500).optional(),
  published: z.coerce.boolean().default(true),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, "Question is required").max(200),
  answer: z.string().min(5, "Answer is required").max(2000),
  category: z.string().max(40).default("General"),
  position: z.coerce.number().int().min(0).max(99).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(60),
  location: z.string().max(80).optional(),
  quote: z.string().min(10).max(600),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  product: z.string().max(120).optional(),
  position: z.coerce.number().int().min(0).max(99).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const emailTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional(),
  subject: z.string().min(2).max(160),
  preheader: z.string().max(160).optional(),
  bodyHtml: z.string().min(10),
  isActive: z.coerce.boolean().default(true),
});

export const campaignSchema = z.object({
  name: z.string().min(2, "Name your campaign").max(80),
  subject: z.string().min(2, "Add a subject line").max(160),
  bodyHtml: z.string().min(10, "Write your message").max(20_000),
  audience: z.enum(["ALL_CUSTOMERS", "NEWSLETTER", "ACCOUNT_HOLDERS"]).default("ALL_CUSTOMERS"),
});

export const addressFormSchema = addressSchema.extend({
  id: z.string().optional(),
  isDefault: z.coerce.boolean().default(false),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  phone: z.string().max(24).optional(),
  marketingOptIn: z.coerce.boolean().default(false),
});

export const couponFormSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minSpendPence: z.coerce.number().int().min(0).default(0),
  maxUses: z.coerce.number().int().min(1).optional(),
  isActive: z.coerce.boolean().default(true),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
export type ProductFormInput = z.infer<typeof productFormSchema>;

