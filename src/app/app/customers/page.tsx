import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return <div className="py-12 text-center text-muted-foreground">Configurá tu cuenta primero.</div>;
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.whatsappNumber,
      createdAt: customers.createdAt,
      totalOrders: sql<number>`count(${orders.id})::int`,
      totalSpent: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
      lastOrder: sql<string>`max(${orders.createdAt})`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(eq(customers.tenantId, tenantId))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(200);

  const serialized = rows.map((c) => ({
    id: c.id,
    name: c.name ?? c.phone,
    phone: c.phone,
    totalOrders: c.totalOrders,
    totalSpent: parseFloat(c.totalSpent),
    lastOrder: c.lastOrder ?? "",
    since: c.createdAt.toISOString(),
  }));

  return <CustomersClient customers={serialized} />;
}
