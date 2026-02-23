/**
 * MercadoPago integration module
 *
 * Handles OAuth flow, preference (checkout link) creation,
 * and payment notification processing.
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// --- OAuth ---

const MP_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID!;
const MP_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET!;
const MP_REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI!; // e.g. https://vendebot.vercel.app/api/mercadopago/oauth/callback

/**
 * Build the MercadoPago OAuth authorization URL.
 * The tenant's clerkUserId is passed as `state` for mapping on callback.
 */
export function getOAuthUrl(clerkUserId: string): string {
  const params = new URLSearchParams({
    client_id: MP_CLIENT_ID,
    response_type: "code",
    platform_id: "mp",
    redirect_uri: MP_REDIRECT_URI,
    state: clerkUserId,
  });
  return `https://auth.mercadopago.com.ar/authorization?${params.toString()}`;
}

/**
 * Exchange an OAuth authorization code for access + refresh tokens.
 */
export async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: MP_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MercadoPago OAuth error: ${err}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    user_id: number;
    expires_in: number;
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MercadoPago refresh error: ${err}`);
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

// --- Preferences (checkout links) ---

export interface CheckoutItem {
  title: string;
  quantity: number;
  unitPrice: number;
  currencyId?: string;
}

export interface CreateCheckoutParams {
  accessToken: string;
  orderId: string;
  items: CheckoutItem[];
  payerEmail?: string;
  /** URL to redirect after payment */
  backUrl?: string;
  /** Webhook notification URL */
  notificationUrl: string;
}

/**
 * Create a MercadoPago checkout preference and return the init_point URL.
 */
export async function createCheckoutPreference(params: CreateCheckoutParams) {
  const client = new MercadoPagoConfig({ accessToken: params.accessToken });
  const preference = new Preference(client);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vendebot.vercel.app";

  const result = await preference.create({
    body: {
      items: params.items.map((item, idx) => ({
        id: String(idx + 1),
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: item.currencyId || "ARS",
      })),
      external_reference: params.orderId,
      notification_url: params.notificationUrl,
      back_urls: {
        success: params.backUrl || `${appUrl}/app/orders?payment=success`,
        failure: params.backUrl || `${appUrl}/app/orders?payment=failure`,
        pending: params.backUrl || `${appUrl}/app/orders?payment=pending`,
      },
      auto_return: "approved",
      payer: params.payerEmail ? { email: params.payerEmail } : undefined,
    },
  });

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point!,
  };
}

// --- Payment lookup ---

/**
 * Fetch payment details by payment ID.
 */
export async function getPayment(accessToken: string, paymentId: string) {
  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
