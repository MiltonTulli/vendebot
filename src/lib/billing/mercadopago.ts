/**
 * MercadoPago Subscriptions (Preapproval) for multi-tenant billing.
 *
 * Uses the Preapproval API to create recurring subscriptions.
 * Docs: https://www.mercadopago.com.ar/developers/es/reference/subscriptions
 */

import { getPlan } from "./plans";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_PLATFORM_ACCESS_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vendebot.vercel.app";

interface CreateSubscriptionParams {
  planId: "starter" | "pro" | "business";
  payerEmail: string;
  tenantId: string;
  backUrl?: string;
}

/**
 * Create a MercadoPago preapproval (subscription) for a tenant.
 */
export async function createSubscription({
  planId,
  payerEmail,
  tenantId,
  backUrl,
}: CreateSubscriptionParams) {
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const body = {
    reason: `VendéBot ${plan.name} - Suscripción mensual`,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: plan.priceArs,
      currency_id: "ARS",
    },
    payer_email: payerEmail,
    back_url: backUrl || `${BASE_URL}/app/billing`,
    external_reference: `${tenantId}:${planId}`,
    status: "pending",
  };

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`MP preapproval failed: ${JSON.stringify(err)}`);
  }

  return (await res.json()) as {
    id: string;
    init_point: string;
    status: string;
    payer_id: number;
  };
}

/**
 * Get subscription status from MercadoPago.
 */
export async function getSubscriptionStatus(preapprovalId: string) {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    }
  );

  if (!res.ok) throw new Error("Failed to get subscription status");

  return (await res.json()) as {
    id: string;
    status: string;
    payer_id: number;
    auto_recurring: { transaction_amount: number };
    external_reference: string;
    date_created: string;
    next_payment_date: string;
  };
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(preapprovalId: string) {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    }
  );

  if (!res.ok) throw new Error("Failed to cancel subscription");
  return await res.json();
}
