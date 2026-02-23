/**
 * POST /api/invoices/send-whatsapp
 *
 * Send an invoice PDF to a customer via WhatsApp.
 * Body: { invoiceId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, invoices, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getWhatsAppProvider } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenant.id)))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    if (!invoice.customerId) {
      return NextResponse.json(
        { error: "Factura sin cliente asociado" },
        { status: 400 }
      );
    }

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, invoice.customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const wa = getWhatsAppProvider();

    // Format invoice info
    const pvStr = String(invoice.pointOfSale || 1).padStart(5, "0");
    const numStr = String(invoice.invoiceNumber || 0).padStart(8, "0");

    await wa.sendMessage(
      customer.whatsappNumber,
      `🧾 *Factura ${invoice.invoiceType} ${pvStr}-${numStr}*\n\n` +
        `Monto: $${parseFloat(invoice.totalAmount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}\n` +
        `CAE: ${invoice.cae}\n` +
        `Vencimiento CAE: ${invoice.caeExpiry?.toLocaleDateString("es-AR") || "N/A"}\n\n` +
        `Gracias por tu compra! 🙏`
    );

    // Note: Sending PDF as media via WhatsApp depends on the provider.
    // For Twilio, you'd need to host the PDF at a public URL.
    // For now, we send the invoice details as text.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send WhatsApp invoice error:", error);
    return NextResponse.json(
      { error: "Error al enviar factura por WhatsApp" },
      { status: 500 }
    );
  }
}
