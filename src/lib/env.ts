/**
 * Centralised environment access.
 *
 * Nothing here throws at import time so that the app builds and boots without
 * optional third-party keys — integrations degrade gracefully at runtime.
 */

const bool = (value: string | undefined) => value === "true" || value === "1";

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  directUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",

  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID ?? "",
  paypalEnv: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",

  emailProvider: (process.env.EMAIL_PROVIDER ?? "resend").toLowerCase(),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",

  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpSecure: (process.env.SMTP_SECURE ?? "true") !== "false",

  // Media uploads. `BLOB_READ_WRITE_TOKEN` is injected by the Vercel Blob store;
  // without it the admin falls back to writing into `public/uploads` (dev only).
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
  mediaProvider: (process.env.MEDIA_PROVIDER ?? "").toLowerCase(),
  mediaMaxBytes: Number(process.env.MEDIA_MAX_BYTES ?? 4_194_304),

  emailFrom: process.env.EMAIL_FROM ?? "The Elites House <orders@theeliteshouse.com>",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@theeliteshouse.com",
  ordersEmail: process.env.NEXT_PUBLIC_ORDERS_EMAIL ?? "orders@theeliteshouse.com",
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "orders@theeliteshouse.com",

  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  cronSecret: process.env.CRON_SECRET ?? "",

  allowDemoPaymentsFlag: bool(process.env.ALLOW_DEMO_PAYMENTS),

  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@theeliteshouse.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "LushAdmin2026!",
  seedCustomerEmail: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com",
  seedCustomerPassword: process.env.SEED_CUSTOMER_PASSWORD ?? "LushCustomer2026!",
} as const;

export const isGoogleAuthEnabled = Boolean(env.googleClientId && env.googleClientSecret);

export const isStripeConfigured = Boolean(
  env.stripeSecretKey && env.stripePublishableKey,
);

export const isPayPalConfigured = Boolean(env.paypalClientId && env.paypalClientSecret);

/** Resolves EMAIL_PROVIDER to the transport we actually implement. */
export const emailTransport = (
  ["smtp", "sendgrid"].includes(env.emailProvider) ? env.emailProvider : "resend"
) as "smtp" | "sendgrid" | "resend";

const emailCredentialsPresent =
  emailTransport === "smtp"
    ? Boolean(env.smtpHost && env.smtpUser && env.smtpPassword)
    : emailTransport === "sendgrid"
      ? Boolean(env.sendgridApiKey)
      : Boolean(env.resendApiKey);

export const isEmailConfigured = Boolean(emailCredentialsPresent && env.emailFrom);

/**
 * Demo payments let you exercise the whole checkout → webhook-free fulfilment
 * flow locally. Hard-blocked in production regardless of the flag.
 */
export const allowDemoPayments =
  env.allowDemoPaymentsFlag && process.env.NODE_ENV !== "production";

export const paymentMethods = {
  stripe: isStripeConfigured,
  paypal: isPayPalConfigured,
  demo: allowDemoPayments,
} as const;

export const hasAnyPaymentMethod =
  paymentMethods.stripe || paymentMethods.paypal || paymentMethods.demo;
