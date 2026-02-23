"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  Loader2,
} from "lucide-react";

interface AnalyticsData {
  period: { days: number; since: string };
  overview: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    confirmedOrders: number;
    cancelledOrders: number;
    paidOrders: number;
    totalConversations: number;
    conversionRate: number;
    totalCustomers: number;
    newCustomers: number;
  };
  revenueByDay: Array<{ date: string; revenue: string; orderCount: number }>;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
}

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const o = data.overview;
  const maxRevenue = Math.max(
    ...data.revenueByDay.map((d) => parseFloat(d.revenue)),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Métricas de conversión, ingresos y productos
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatARS(o.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {o.paidOrders} pagos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{o.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Ticket promedio: {formatARS(o.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{o.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {o.totalConversations} conversaciones → {o.totalOrders} pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{o.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="inline h-3 w-3" /> {o.newCustomers} nuevos en el período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart (simple bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Ingresos por día
            </CardTitle>
            <CardDescription>Últimos {days} días</CardDescription>
          </CardHeader>
          <CardContent>
            {data.revenueByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin datos en este período
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.revenueByDay.map((d) => {
                  const rev = parseFloat(d.revenue);
                  const pct = (rev / maxRevenue) * 100;
                  return (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="w-24 text-muted-foreground shrink-0">
                        {new Date(d.date + "T12:00:00").toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-5" />
                      </div>
                      <span className="w-28 text-right font-medium shrink-0">
                        {formatARS(rev)}
                      </span>
                      <Badge variant="outline" className="shrink-0">
                        {d.orderCount}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Por ingresos en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin ventas en este período
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatARS(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {data.ordersByStatus.map((s) => (
              <div
                key={s.status}
                className="flex items-center gap-2 rounded-lg border px-4 py-3"
              >
                <span className="text-2xl font-bold">{s.count}</span>
                <span className="text-sm text-muted-foreground">
                  {statusLabels[s.status] || s.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
