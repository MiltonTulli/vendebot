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

// Demo data — in production these come from DB queries
const stats = [
  {
    title: "Pedidos hoy",
    value: "12",
    change: "+3 vs ayer",
    icon: ShoppingCart,
  },
  {
    title: "Mensajes hoy",
    value: "148",
    change: "+22%",
    icon: MessageSquare,
  },
  {
    title: "Ingresos hoy",
    value: "$125.400",
    change: "+15%",
    icon: DollarSign,
  },
  {
    title: "Clientes activos",
    value: "34",
    change: "+5 nuevos",
    icon: Users,
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "María García", total: "$12.500", status: "pending", time: "Hace 5 min" },
  { id: "ORD-002", customer: "Juan Pérez", total: "$8.200", status: "confirmed", time: "Hace 12 min" },
  { id: "ORD-003", customer: "Ana López", total: "$23.100", status: "preparing", time: "Hace 25 min" },
  { id: "ORD-004", customer: "Carlos Ruiz", total: "$5.800", status: "delivered", time: "Hace 1h" },
  { id: "ORD-005", customer: "Laura Fernández", total: "$15.600", status: "ready", time: "Hace 2h" },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  preparing: { label: "Preparando", variant: "default" },
  ready: { label: "Listo", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const recentConversations = [
  { customer: "María García", lastMessage: "Perfecto, esperamos el pedido", time: "Hace 2 min", unread: true },
  { customer: "Pedro Sánchez", lastMessage: "¿Tienen envío a Zona Norte?", time: "Hace 8 min", unread: true },
  { customer: "Lucía Torres", lastMessage: "Gracias, quedó todo genial 🙌", time: "Hace 15 min", unread: false },
  { customer: "Martín Díaz", lastMessage: "Quiero 2 docenas de empanadas", time: "Hace 30 min", unread: false },
];

export default function DashboardPage() {
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
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {s.change}
                </p>
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
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{o.customer}</span>
                    <span className="text-xs text-muted-foreground">{o.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {o.time}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{o.total}</span>
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
            {recentConversations.map((c) => (
              <div
                key={c.customer}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.customer}</span>
                    {c.unread && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.lastMessage}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
