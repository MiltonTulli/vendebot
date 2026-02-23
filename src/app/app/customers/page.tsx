"use client";

import { useState } from "react";
import {
  Users,
  Search,
  User,
  ShoppingCart,
  MessageSquare,
  Phone,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const demoCustomers = [
  {
    id: "1",
    name: "María García",
    phone: "+54 9 11 1234-5678",
    totalOrders: 15,
    totalSpent: 187500,
    lastOrder: "2026-02-22",
    since: "2026-01-10",
    orders: [
      { id: "ORD-001", date: "2026-02-22", total: 15300, status: "pending" },
      { id: "ORD-012", date: "2026-02-18", total: 8500, status: "delivered" },
      { id: "ORD-025", date: "2026-02-10", total: 22400, status: "delivered" },
    ],
  },
  {
    id: "2",
    name: "Juan Pérez",
    phone: "+54 9 11 9876-5432",
    totalOrders: 8,
    totalSpent: 92000,
    lastOrder: "2026-02-22",
    since: "2026-01-20",
    orders: [
      { id: "ORD-002", date: "2026-02-22", total: 13000, status: "confirmed" },
      { id: "ORD-018", date: "2026-02-14", total: 6500, status: "delivered" },
    ],
  },
  {
    id: "3",
    name: "Ana López",
    phone: "+54 9 11 5555-1234",
    totalOrders: 22,
    totalSpent: 310000,
    lastOrder: "2026-02-22",
    since: "2025-12-05",
    orders: [
      { id: "ORD-003", date: "2026-02-22", total: 20200, status: "preparing" },
      { id: "ORD-015", date: "2026-02-16", total: 14800, status: "delivered" },
      { id: "ORD-030", date: "2026-02-08", total: 9200, status: "delivered" },
    ],
  },
  {
    id: "4",
    name: "Carlos Ruiz",
    phone: "+54 9 11 4444-5678",
    totalOrders: 3,
    totalSpent: 42500,
    lastOrder: "2026-02-22",
    since: "2026-02-15",
    orders: [
      { id: "ORD-004", date: "2026-02-22", total: 18500, status: "delivered" },
    ],
  },
  {
    id: "5",
    name: "Laura Fernández",
    phone: "+54 9 11 3333-9876",
    totalOrders: 11,
    totalSpent: 145800,
    lastOrder: "2026-02-22",
    since: "2026-01-05",
    orders: [
      { id: "ORD-005", date: "2026-02-22", total: 15400, status: "ready" },
      { id: "ORD-020", date: "2026-02-12", total: 11200, status: "delivered" },
    ],
  },
  {
    id: "6",
    name: "Pedro Sánchez",
    phone: "+54 9 11 8888-1234",
    totalOrders: 6,
    totalSpent: 78000,
    lastOrder: "2026-02-20",
    since: "2026-01-25",
    orders: [
      { id: "ORD-028", date: "2026-02-20", total: 12300, status: "delivered" },
    ],
  },
];

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof demoCustomers)[0] | null>(null);

  const filtered = demoCustomers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {demoCustomers.length} clientes registrados
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customers list */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pedidos</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total gastado</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Último pedido</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Cliente desde</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => setSelected(c)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{c.totalOrders}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  ${c.totalSpent.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.lastOrder).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.since).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Customer detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {selected.phone}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{selected.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Pedidos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">
                        ${(selected.totalSpent / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-muted-foreground">Gastado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">
                        ${Math.round(selected.totalSpent / selected.totalOrders).toLocaleString("es-AR")}
                      </p>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                    Historial de pedidos
                  </h4>
                  <div className="space-y-2">
                    {selected.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <span className="text-sm font-medium">{o.id}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.date).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            ${o.total.toLocaleString("es-AR")}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {statusLabels[o.status] ?? o.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
