import {
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { orders, messages, customers, conversations } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  preparing: { label: "Preparando", variant: "default" },
  ready: { label: "Listo", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default async function DashboardPage() {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h1 className="text-2xl font-bold">Bienvenido a VendéBot</h1>
        <p className="text-muted-foreground">Completá la configuración inicial para empezar.</p>
        <Button asChild><Link href="/app/onboarding">Configurar</Link></Button>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel queries
  const [
    ordersToday,
    messagesToday,
    revenueToday,
    activeCustomers,
    recentOrderRows,
    recentConvRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, today)))
      .then(r => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(conversations.tenantId, tenantId), gte(messages.createdAt, today)))
      .then(r => r[0]?.count ?? 0),
    db.select({ total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, today)))
      .then(r => parseFloat(r[0]?.total ?? "0")),
    db.select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .then(r => r[0]?.count ?? 0),
    db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      customerName: customers.name,
    })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db.select({
      id: conversations.id,
      whatsappNumber: conversations.whatsappNumber,
      updatedAt: conversations.updatedAt,
      customerName: customers.name,
      status: conversations.status,
    })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(desc(conversations.updatedAt))
      .limit(4),
  ]);

  const stats = [
    { title: "Pedidos hoy", value: String(ordersToday), icon: ShoppingCart },
    { title: "Mensajes hoy", value: String(messagesToday), icon: MessageSquare },
    { title: "Ingresos hoy", value: `$${revenueToday.toLocaleString("es-AR")}`, icon: DollarSign },
    { title: "Clientes", value: String(activeCustomers), icon: Users },
  ];

  function timeAgo(date: Date) {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen de hoy</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/onboarding">
            <Package className="mr-2 h-4 w-4" />
            Configuración inicial
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Últimos pedidos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/orders">
                Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            {recentOrderRows.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay pedidos aún</p>
            )}
            {recentOrderRows.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{o.customerName ?? "Cliente"}</span>
                    <span className="text-xs text-muted-foreground">{o.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(o.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">${parseFloat(o.totalAmount).toLocaleString("es-AR")}</span>
                  <Badge variant={statusLabels[o.status]?.variant ?? "outline"}>
                    {statusLabels[o.status]?.label ?? o.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Conversaciones recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/conversations">
                Ver todas <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            {recentConvRows.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay conversaciones aún</p>
            )}
            {recentConvRows.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.customerName ?? c.whatsappNumber}</span>
                    {c.status === "active" && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.whatsappNumber}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(c.updatedAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
