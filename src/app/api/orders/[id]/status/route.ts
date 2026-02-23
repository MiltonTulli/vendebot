import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { orders, customers, orderTrackingTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderStatusUpdate } from "@/lib/integrations/whatsapp-order-updates";
import { generateTrackingToken } from "@/lib/integrations/order-tracking";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  // Update order status
  await db
    .update(orders)
    .set({ status: status as "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, id));

  // Get order + customer for notification
  const order = await db.select().from(orders).where(eq(orders.id, id)).then((r) => r[0]);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .then((r) => r[0]);

  // Ensure tracking token exists
  let trackingRow = await db
    .select()
    .from(orderTrackingTokens)
    .where(eq(orderTrackingTokens.orderId, id))
    .then((r) => r[0]);

  if (!trackingRow) {
    const token = generateTrackingToken();
    const inserted = await db
      .insert(orderTrackingTokens)
      .values({ orderId: id, token })
      .returning();
    trackingRow = inserted[0];
  }

  // Send WhatsApp notification
  if (customer?.whatsappNumber) {
    try {
      await sendOrderStatusUpdate({
        customerPhone: customer.whatsappNumber,
        orderId: id,
        newStatus: status,
        trackingToken: trackingRow?.token,
      });
    } catch (e) {
      console.error("Failed to send WhatsApp status update:", e);
    }
  }

  return NextResponse.json({ success: true, status, trackingToken: trackingRow?.token });
}
