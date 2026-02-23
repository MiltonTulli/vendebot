/**
 * POST /api/invoices/generate
 *
 * Generate an electronic invoice for an order.
 * Called automatically on payment confirmation or manually from dashboard.
 *
 * Body: { orderId: string, buyerCuit?: string, buyerDni?: string,
 *         buyerName?: string, buyerIvaCondition?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, orders, customers, invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createAfipClient,
  generateInvoice,
  determineInvoiceType,
  type IvaCondition,
} from "@/lib/afip";
import { generateInvoicePdf, type InvoicePdfData } from "@/lib/afip/pdf";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId es requerido" },
        { status: 400 }
      );
    }

    // Get tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    if (!tenant.afipCert || !tenant.afipKey || !tenant.afipCuit) {
      return NextResponse.json(
        {
          error:
            "AFIP no configurado. Configure certificado y clave en Configuración > Facturación.",
        },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this order
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(eq(invoices.orderId, orderId), eq(invoices.tenantId, tenant.id))
      )
      .limit(1);

    if (existingInvoice?.cae) {
      return NextResponse.json(
        { error: "Ya existe una factura para este pedido", invoice: existingInvoice },
        { status: 409 }
      );
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenant.id)))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

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

    // Determine buyer fiscal data
    const buyerCuit =
      body.buyerCuit || customer?.fiscalData?.cuit || undefined;
    const buyerName =
      body.buyerName ||
      customer?.fiscalData?.fiscalName ||
      customer?.name ||
      "Consumidor Final";
    const buyerIvaCondition: IvaCondition =
      (body.buyerIvaCondition as IvaCondition) ||
      (customer?.fiscalData?.ivaCondition as IvaCondition) ||
      "consumidor_final";

    // Determine seller IVA condition from tenant config
    const tenantBusinessInfo = tenant.businessInfo as Record<string, unknown> | null;
    const sellerIvaCondition: IvaCondition =
      (tenantBusinessInfo?.ivaCondition as IvaCondition) || "monotributista";

    // Determine invoice type
    const invoiceType = determineInvoiceType(sellerIvaCondition, buyerIvaCondition);

    // Create AFIP client
    const afip = createAfipClient({
      cuit: tenant.afipCuit,
      cert: tenant.afipCert,
      key: tenant.afipKey,
      production: process.env.AFIP_PRODUCTION === "true",
    });

    // Default point of sale (can be configured per tenant later)
    const pointOfSale = 1;
    const totalAmount = parseFloat(order.totalAmount);

    // Generate invoice at AFIP
    const result = await generateInvoice(afip, {
      items: (order.items as Array<{ productName: string; quantity: number; unitPrice: number; total: number }>).map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      totalAmount,
      invoiceType,
      buyerCuit,
      buyerDni: body.buyerDni,
      buyerName,
      buyerIvaCondition,
      pointOfSale,
    });

    // Generate PDF
    const IVA_LABELS: Record<IvaCondition, string> = {
      responsable_inscripto: "Responsable Inscripto",
      monotributista: "Monotributista",
      exento: "Exento",
      consumidor_final: "Consumidor Final",
      no_responsable: "No Responsable",
    };

    const pdfData: InvoicePdfData = {
      sellerName: tenant.businessName,
      sellerCuit: tenant.afipCuit,
      sellerAddress: (tenantBusinessInfo?.address as string) || "",
      sellerIvaCondition: IVA_LABELS[sellerIvaCondition],
      buyerName,
      buyerCuit,
      buyerDni: body.buyerDni,
      buyerIvaCondition: IVA_LABELS[buyerIvaCondition],
      invoiceType,
      pointOfSale: result.pointOfSale,
      invoiceNumber: result.voucherNumber,
      date: new Date(),
      cae: result.cae,
      caeExpiry: result.caeExpiry,
      items: (order.items as Array<{ productName: string; quantity: number; unitPrice: number; total: number }>).map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      totalAmount,
    };

    const pdfBuffer = await generateInvoicePdf(pdfData);

    // Store PDF as base64 (in production, upload to S3/Cloudflare R2)
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Save invoice to DB
    const [invoice] = await db
      .insert(invoices)
      .values({
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
      })
      .returning();

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceType: invoice.invoiceType,
        cae: invoice.cae,
        caeExpiry: invoice.caeExpiry,
        pointOfSale: invoice.pointOfSale,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    const message =
      error instanceof Error ? error.message : "Error al generar factura";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
