import { db } from "@/lib/db";
import { orders, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return <div className="py-12 text-center text-muted-foreground">Configurá tu cuenta primero.</div>;
  }

  const rows = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      items: orders.items,
      notes: orders.notes,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerPhone: customers.whatsappNumber,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.tenantId, tenantId))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const serialized = rows.map((o) => ({
    id: o.id,
    customer: o.customerName ?? "Cliente",
    phone: o.customerPhone ?? "",
    items: (o.items as Array<{ productName: string; quantity: number; unitPrice: number; total: number }>) ?? [],
    total: parseFloat(o.totalAmount),
    status: o.status,
    payment: o.paymentStatus ?? "pending",
    date: o.createdAt.toISOString(),
    notes: o.notes ?? "",
  }));

  return <OrdersClient orders={serialized} />;
}
