/**
 * POST /api/mercadopago/create-preference
 *
 * Body: { orderId: string }
 * Creates a MercadoPago checkout preference for the given order
 * and stores the payment link + preference ID in the order.
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createCheckoutPreference } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { orderId } = body as { orderId: string };

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Get tenant
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .limit(1);

  if (!tenant || !tenant.mercadopagoAccessToken) {
    return NextResponse.json(
      { error: "MercadoPago not connected" },
      { status: 400 }
    );
  }

  // Get order
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenant.id)))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://vendebot.vercel.app";
  const notificationUrl = `${appUrl}/api/mercadopago/webhook`;

  const items = (
    order.items as Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
    }>
  ).map((item) => ({
    title: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));

  try {
    const preference = await createCheckoutPreference({
      accessToken: tenant.mercadopagoAccessToken,
      orderId: order.id,
      items,
      notificationUrl,
    });

    // Update order with payment link
    await db
      .update(orders)
      .set({
        paymentLink: preference.initPoint,
        mercadopagoPreferenceId: preference.preferenceId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      paymentLink: preference.initPoint,
      preferenceId: preference.preferenceId,
    });
  } catch (error) {
    console.error("Error creating MP preference:", error);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
