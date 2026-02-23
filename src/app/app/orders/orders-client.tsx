"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "secondary" },
  preparing: { label: "Preparando", variant: "default" },
  ready: { label: "Listo", variant: "default" },
  delivered: { label: "Entregado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const paymentStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: string }> = {
  pending: { label: "Pago pendiente", variant: "outline", icon: "🕐" },
  paid: { label: "Pagado", variant: "default", icon: "✅" },
  rejected: { label: "Rechazado", variant: "destructive", icon: "❌" },
  refunded: { label: "Reembolsado", variant: "secondary", icon: "↩️" },
  cancelled: { label: "Cancelado", variant: "destructive", icon: "🚫" },
};

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment: string;
  date: string;
  notes: string;
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cliente o ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Listo</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((order) => (
          <Card key={order.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedOrder(order)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{order.customer}</span>
                    <span className="text-xs text-muted-foreground">{order.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(order.date).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    <span>·</span>
                    <span>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={paymentStatusConfig[order.payment]?.variant ?? "outline"}>
                  {paymentStatusConfig[order.payment]?.icon ?? ""}{" "}
                  {paymentStatusConfig[order.payment]?.label ?? order.payment}
                </Badge>
                <span className="text-sm font-bold">${order.total.toLocaleString("es-AR")}</span>
                <Badge variant={statusConfig[order.status]?.variant ?? "outline"}>
                  {statusConfig[order.status]?.label ?? order.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No se encontraron pedidos</div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Pedido {selectedOrder.id.slice(0, 8)}</span>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant ?? "outline"}>
                    {statusConfig[selectedOrder.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{selectedOrder.customer}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Items</p>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="font-medium">${item.total.toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total</span>
                    <span>${selectedOrder.total.toLocaleString("es-AR")}</span>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Notas</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
