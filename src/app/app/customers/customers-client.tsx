"use client";

import { useState } from "react";
import {
  Search,
  User,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  since: string;
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">{customers.length} clientes registrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o teléfono..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

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
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{c.totalOrders}</td>
                <td className="px-4 py-3 text-right font-semibold">${c.totalSpent.toLocaleString("es-AR")}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString("es-AR") : "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(c.since).toLocaleDateString("es-AR")}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowUpRight className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">No se encontraron clientes</div>}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{selected.phone}</div>
                <div className="grid grid-cols-3 gap-3">
                  <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{selected.totalOrders}</p><p className="text-xs text-muted-foreground">Pedidos</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">${(selected.totalSpent / 1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">Gastado</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">${selected.totalOrders > 0 ? Math.round(selected.totalSpent / selected.totalOrders).toLocaleString("es-AR") : 0}</p><p className="text-xs text-muted-foreground">Promedio</p></CardContent></Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
