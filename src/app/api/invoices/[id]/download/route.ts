/**
 * GET /api/invoices/[id]/download
 *
 * Download invoice PDF.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, invoices } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

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
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenant.id)))
      .limit(1);

    if (!invoice || !invoice.pdfUrl) {
      return NextResponse.json(
        { error: "Factura no encontrada o sin PDF" },
        { status: 404 }
      );
    }

    // Extract base64 data
    const base64Data = invoice.pdfUrl.replace(
      "data:application/pdf;base64,",
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");

    const pvStr = String(invoice.pointOfSale || 1).padStart(5, "0");
    const numStr = String(invoice.invoiceNumber || 0).padStart(8, "0");
    const filename = `factura_${invoice.invoiceType}_${pvStr}-${numStr}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Download invoice error:", error);
    return NextResponse.json(
      { error: "Error al descargar factura" },
      { status: 500 }
    );
  }
}
