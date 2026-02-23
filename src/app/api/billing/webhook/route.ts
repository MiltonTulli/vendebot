import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSubscriptionStatus } from "@/lib/billing/mercadopago";

/**
 * MercadoPago webhook for subscription (preapproval) status updates.
 * Configure in MP dashboard: POST /api/billing/webhook
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // MP sends { type: "subscription_preapproval", data: { id: "..." } }
  if (body.type !== "subscription_preapproval" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const preapprovalId = body.data.id as string;

  try {
    const mpSub = await getSubscriptionStatus(preapprovalId);

    const statusMap: Record<string, "pending" | "authorized" | "paused" | "cancelled"> = {
      pending: "pending",
      authorized: "authorized",
      paused: "paused",
      cancelled: "cancelled",
    };

    const newStatus = statusMap[mpSub.status] || "pending";

    await db
      .update(subscriptions)
      .set({
        status: newStatus,
        mpPayerId: String(mpSub.payer_id),
        currentPeriodStart: new Date(mpSub.date_created),
        currentPeriodEnd: mpSub.next_payment_date
          ? new Date(mpSub.next_payment_date)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.mpPreapprovalId, preapprovalId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
