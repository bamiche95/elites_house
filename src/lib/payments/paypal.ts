import "server-only";

import { env, isPayPalConfigured } from "@/lib/env";

const PAYPAL_BASE =
  env.paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken() {
  if (!isPayPalConfigured) throw new Error("PayPal is not configured");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${env.paypalClientId}:${env.paypalClientSecret}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed (${response.status})`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

function paypalAmount(pence: number) {
  return (pence / 100).toFixed(2);
}

export type CreatePayPalOrderInput = {
  amountPence: number;
  reference: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
};

export async function createPayPalOrder({
  amountPence,
  reference,
  description,
  returnUrl,
  cancelUrl,
}: CreatePayPalOrderInput) {
  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: reference,
          description: description.slice(0, 127),
          custom_id: reference,
          amount: {
            currency_code: "GBP",
            value: paypalAmount(amountPence),
          },
        },
      ],
      application_context: {
        brand_name: "LushTresses",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as {
    id?: string;
    message?: string;
    details?: unknown;
  };

  if (!response.ok || !data.id) {
    throw new Error(data.message ?? `PayPal order creation failed (${response.status})`);
  }

  return { id: data.id };
}

export type PayPalCaptureResult = {
  status: string;
  captureId: string;
  amountPence: number;
  referenceId: string;
  raw: Record<string, unknown>;
};

export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as {
    status?: string;
    purchase_units?: Array<{
      reference_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          amount: { value: string; currency_code: string };
        }>;
      };
    }>;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? `PayPal capture failed (${response.status})`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) {
    throw new Error("PayPal did not return a capture for this order");
  }

  return {
    status: data.status ?? "UNKNOWN",
    captureId: capture.id,
    amountPence: Math.round(Number(capture.amount.value) * 100),
    referenceId: data.purchase_units?.[0]?.reference_id ?? "",
    raw: data as unknown as Record<string, unknown>,
  };
}

export async function refundPayPalCapture(captureId: string, amountPence?: number) {
  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      amountPence
        ? { amount: { value: paypalAmount(amountPence), currency_code: "GBP" } }
        : {},
    ),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(detail.message ?? `PayPal refund failed (${response.status})`);
  }
  return true;
}

export type PayPalWebhookHeaders = {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
};

export async function verifyPayPalWebhook(
  headers: PayPalWebhookHeaders,
  event: unknown,
): Promise<boolean> {
  if (!env.paypalWebhookId) return false;
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo,
        transmission_sig: headers.transmissionSig,
        webhook_id: env.paypalWebhookId,
        webhook_event: event,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export const paypalConfig = {
  clientId: env.paypalClientId,
  currency: "GBP",
  intent: "capture" as const,
};
