/**
 * GET /api/invoices
 *
 * List invoices for the current tenant.
 * Query params: ?page=1&limit=20&status=all|pending|completed
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, invoices, orders, customers } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, isNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "all";
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(invoices.tenantId, tenant.id)];
    if (status === "completed") {
      conditions.push(isNotNull(invoices.cae));
    } else if (status === "pending") {
      conditions.push(isNull(invoices.cae));
    }

    const where = and(...conditions);

    // Get invoices with order and customer info
    const invoiceList = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        customerId: invoices.customerId,
        invoiceType: invoices.invoiceType,
        cae: invoices.cae,
        caeExpiry: invoices.caeExpiry,
        pointOfSale: invoices.pointOfSale,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        pdfUrl: invoices.pdfUrl,
        createdAt: invoices.createdAt,
        customerName: customers.name,
        orderStatus: orders.status,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(where);

    return NextResponse.json({
      invoices: invoiceList.map((inv) => ({
        ...inv,
        // Don't send full PDF data in list view
        pdfUrl: inv.pdfUrl ? true : false,
        hasPdf: !!inv.pdfUrl,
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { error: "Error al listar facturas" },
      { status: 500 }
    );
  }
}
