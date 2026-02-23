/**
 * POST /api/mercadopago/webhook
 *
 * Receives payment notifications from MercadoPago.
 * On approved payment: updates order status + notifies owner via WhatsApp.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, tenants, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPayment } from "@/lib/mercadopago";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { generateInvoiceForOrder } from "@/lib/afip/auto-invoice";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago sends different notification types
    // We only care about payment notifications
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // We need to find the order by external_reference to get the tenant's access token
    // First, try to get payment info using the app's credentials or iterate
    // MercadoPago webhook includes user_id for the seller
    const mpUserId = String(body.user_id || "");

    // Find tenant by MP user ID
    const [tenant] = mpUserId
      ? await db
          .select()
          .from(tenants)
          .where(eq(tenants.mercadopagoUserId, mpUserId))
          .limit(1)
      : [];

    if (!tenant?.mercadopagoAccessToken) {
      console.error("Tenant not found for MP user:", mpUserId);
      return NextResponse.json({ ok: true });
    }

    // Get full payment details
    const payment = await getPayment(
      tenant.mercadopagoAccessToken,
      String(paymentId)
    );

    const orderId = payment.external_reference;
    if (!orderId) {
      return NextResponse.json({ ok: true });
    }

    // Map MP status to our payment status
    const statusMap: Record<string, string> = {
      approved: "paid",
      pending: "pending",
      authorized: "pending",
      in_process: "pending",
      in_mediation: "in_mediation",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "charged_back",
    };

    const paymentStatus = statusMap[payment.status || ""] || "unknown";

    // Update order
    const updateData: Record<string, unknown> = {
      paymentStatus,
      mercadopagoPaymentId: String(paymentId),
      updatedAt: new Date(),
    };

    // If payment approved, confirm the order
    if (paymentStatus === "paid") {
      updateData.status = "confirmed";
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    // Auto-generate invoice on payment confirmation
    if (paymentStatus === "paid") {
      try {
        await generateInvoiceForOrder(tenant, orderId);
      } catch (invoiceError) {
        console.error("Auto-invoice generation failed:", invoiceError);
        // Don't fail the webhook — invoice can be retried manually
      }
    }

    // Notify owner via WhatsApp if payment approved
    if (paymentStatus === "paid" && tenant.ownerPhoneNumber) {
      try {
        // Get order + customer info
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        let customerName = "Cliente";
        if (order?.customerId) {
          const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, order.customerId))
            .limit(1);
          if (customer?.name) customerName = customer.name;
        }

        const amount = payment.transaction_amount || order?.totalAmount || "?";
        const wa = getWhatsAppProvider();
        await wa.sendMessage(
          tenant.ownerPhoneNumber,
          `💰 ¡Pago recibido!\n\nPedido #${orderId.slice(0, 8)}\nCliente: ${customerName}\nMonto: $${amount}\nEstado: Confirmado ✅`
        );
      } catch (notifyError) {
        console.error("Failed to notify owner:", notifyError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    // Always return 200 to avoid MP retries on processing errors
    return NextResponse.json({ ok: true });
  }
}
