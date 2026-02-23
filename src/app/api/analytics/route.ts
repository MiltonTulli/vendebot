import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, orders, products, conversations, customers } from "@/lib/db/schema";
import { eq, sql, and, gte, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Revenue & order stats
  const orderStats = await db
    .select({
      totalOrders: count(),
      totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
      avgOrderValue: sql<string>`COALESCE(AVG(${orders.totalAmount}::numeric), 0)`,
      confirmedOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} != 'cancelled')`,
      cancelledOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelled')`,
      paidOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.paymentStatus} = 'approved')`,
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenant.id), gte(orders.createdAt, since)));

  // Conversations → orders conversion
  const conversationCount = await db
    .select({ total: count() })
    .from(conversations)
    .where(and(eq(conversations.tenantId, tenant.id), gte(conversations.createdAt, since)));

  const conversionRate =
    conversationCount[0].total > 0
      ? ((orderStats[0].totalOrders / conversationCount[0].total) * 100).toFixed(1)
      : "0";

  // Revenue by day (last N days)
  const revenueByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
      orderCount: count(),
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenant.id), gte(orders.createdAt, since)))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Top products by revenue
  const topProductsQuery = await db.execute(sql`
    SELECT
      item->>'productName' as name,
      SUM((item->>'total')::numeric) as revenue,
      SUM((item->>'quantity')::numeric) as quantity
    FROM ${orders}, jsonb_array_elements(${orders.items}) as item
    WHERE ${orders.tenantId} = ${tenant.id}
      AND ${orders.createdAt} >= ${since}
    GROUP BY item->>'productName'
    ORDER BY revenue DESC
    LIMIT 10
  `);

  // Customer stats
  const customerStats = await db
    .select({ total: count() })
    .from(customers)
    .where(eq(customers.tenantId, tenant.id));

  const newCustomers = await db
    .select({ total: count() })
    .from(customers)
    .where(and(eq(customers.tenantId, tenant.id), gte(customers.createdAt, since)));

  // Orders by status
  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(and(eq(orders.tenantId, tenant.id), gte(orders.createdAt, since)))
    .groupBy(orders.status);

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    overview: {
      totalRevenue: parseFloat(orderStats[0].totalRevenue),
      totalOrders: orderStats[0].totalOrders,
      avgOrderValue: parseFloat(orderStats[0].avgOrderValue),
      confirmedOrders: orderStats[0].confirmedOrders,
      cancelledOrders: orderStats[0].cancelledOrders,
      paidOrders: orderStats[0].paidOrders,
      totalConversations: conversationCount[0].total,
      conversionRate: parseFloat(conversionRate),
      totalCustomers: customerStats[0].total,
      newCustomers: newCustomers[0].total,
    },
    revenueByDay,
    topProducts: topProductsQuery.rows,
    ordersByStatus,
  });
}
