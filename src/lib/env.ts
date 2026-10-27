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
  emailFrom: process.env.EMAIL_FROM ?? "LushTresses <hello@lushtresses.com>",
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? "",

  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  cronSecret: process.env.CRON_SECRET ?? "",

  allowDemoPaymentsFlag: bool(process.env.ALLOW_DEMO_PAYMENTS),

  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@lushtresses.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "LushAdmin2026!",
  seedCustomerEmail: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com",
  seedCustomerPassword: process.env.SEED_CUSTOMER_PASSWORD ?? "LushCustomer2026!",
} as const;

export const isGoogleAuthEnabled = Boolean(env.googleClientId && env.googleClientSecret);

export const isStripeConfigured = Boolean(
  env.stripeSecretKey && env.stripePublishableKey,
);

export const isPayPalConfigured = Boolean(env.paypalClientId && env.paypalClientSecret);

export const isEmailConfigured = Boolean(
  (env.emailProvider === "sendgrid" ? env.sendgridApiKey : env.resendApiKey) &&
    env.emailFrom,
);

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
