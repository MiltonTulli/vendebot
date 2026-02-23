/**
 * Auto-invoice generation on payment confirmation.
 *
 * Called from the MercadoPago webhook when a payment is approved.
 * Generates an invoice and sends it to the customer via WhatsApp.
 */

import { db } from "@/lib/db";
import { orders, customers, invoices, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createAfipClient,
  generateInvoice,
  determineInvoiceType,
  type IvaCondition,
} from "./index";
import { generateInvoicePdf, type InvoicePdfData } from "./pdf";
import { getWhatsAppProvider } from "@/lib/whatsapp";

type Tenant = typeof tenants.$inferSelect;

export async function generateInvoiceForOrder(
  tenant: Tenant,
  orderId: string
): Promise<void> {
  // Check AFIP is configured
  if (!tenant.afipCert || !tenant.afipKey || !tenant.afipCuit) {
    console.log("AFIP not configured for tenant, skipping auto-invoice");
    return;
  }

  // Check if invoice already exists
  const [existing] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.orderId, orderId), eq(invoices.tenantId, tenant.id)))
    .limit(1);

  if (existing?.cae) {
    console.log("Invoice already exists for order", orderId);
    return;
  }

  // Get order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return;

  // Get customer
  let customer = null;
  if (order.customerId) {
    const [c] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);
    customer = c || null;
  }

  const buyerIvaCondition: IvaCondition =
    (customer?.fiscalData?.ivaCondition as IvaCondition) || "consumidor_final";
  const buyerName =
    customer?.fiscalData?.fiscalName || customer?.name || "Consumidor Final";
  const buyerCuit = customer?.fiscalData?.cuit;

  const tenantBusinessInfo = tenant.businessInfo as Record<string, unknown> | null;
  const sellerIvaCondition: IvaCondition =
    (tenantBusinessInfo?.ivaCondition as IvaCondition) || "monotributista";

  const invoiceType = determineInvoiceType(sellerIvaCondition, buyerIvaCondition);

  const afip = createAfipClient({
    cuit: tenant.afipCuit,
    cert: tenant.afipCert,
    key: tenant.afipKey,
    production: process.env.AFIP_PRODUCTION === "true",
  });

  const totalAmount = parseFloat(order.totalAmount);
  const orderItems = order.items as Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  const result = await generateInvoice(afip, {
    items: orderItems.map((item) => ({
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    totalAmount,
    invoiceType,
    buyerCuit,
    buyerName,
    buyerIvaCondition,
    pointOfSale: 1,
  });

  // IVA labels for PDF
  const IVA_LABELS: Record<IvaCondition, string> = {
    responsable_inscripto: "Responsable Inscripto",
    monotributista: "Monotributista",
    exento: "Exento",
    consumidor_final: "Consumidor Final",
    no_responsable: "No Responsable",
  };

  // Generate PDF
  const pdfData: InvoicePdfData = {
    sellerName: tenant.businessName,
    sellerCuit: tenant.afipCuit,
    sellerAddress: (tenantBusinessInfo?.address as string) || "",
    sellerIvaCondition: IVA_LABELS[sellerIvaCondition],
    buyerName,
    buyerCuit,
    buyerIvaCondition: IVA_LABELS[buyerIvaCondition],
    invoiceType,
    pointOfSale: result.pointOfSale,
    invoiceNumber: result.voucherNumber,
    date: new Date(),
    cae: result.cae,
    caeExpiry: result.caeExpiry,
    items: orderItems.map((item) => ({
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    totalAmount,
  };

  const pdfBuffer = await generateInvoicePdf(pdfData);
  const pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

  // Save invoice
  await db.insert(invoices).values({
    tenantId: tenant.id,
    orderId: order.id,
    customerId: order.customerId,
    invoiceType,
    cae: result.cae,
    caeExpiry: result.caeExpiry,
    pointOfSale: result.pointOfSale,
    invoiceNumber: result.voucherNumber,
    totalAmount: order.totalAmount,
    pdfUrl,
  });

  // Send to customer via WhatsApp
  if (customer) {
    try {
      const wa = getWhatsAppProvider();
      const pvStr = String(result.pointOfSale).padStart(5, "0");
      const numStr = String(result.voucherNumber).padStart(8, "0");

      await wa.sendMessage(
        customer.whatsappNumber,
        `🧾 *Factura ${invoiceType} ${pvStr}-${numStr}*\n\n` +
          `Monto: $${totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}\n` +
          `CAE: ${result.cae}\n` +
          `Vto CAE: ${result.caeExpiry.toLocaleDateString("es-AR")}\n\n` +
          `¡Gracias por tu compra! 🙏`
      );
    } catch (waError) {
      console.error("Failed to send invoice via WhatsApp:", waError);
    }
  }
}
