"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const unitLabels: Record<string, string> = {
  unidad: "Unidad",
  kg: "Kg",
  m2: "m²",
  m_lineal: "m lineal",
  litro: "Litro",
  docena: "Docena",
  combo: "Combo",
};

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  inStock: boolean;
  waste: number;
  description: string;
}

export function CatalogClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [view, setView] = useState<"grid" | "table">("table");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Upload className="mr-2 h-3.5 w-3.5" />Importar</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-3.5 w-3.5" />Exportar</Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setShowForm(true); }}><Plus className="mr-2 h-3.5 w-3.5" />Agregar</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar producto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.filter((c) => c !== "all").map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border">
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setView("table")}><List className="h-4 w-4" /></Button>
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {view === "table" && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Producto</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Categoría</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Precio</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Unidad</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3"><span className="font-medium">{p.name}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right font-semibold">${p.price.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{unitLabels[p.unit] ?? p.unit}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={p.inStock ? "secondary" : "destructive"}>{p.inStock ? "Disponible" : "Sin stock"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingProduct(p); setShowForm(true); }}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">No se encontraron productos</div>}
        </div>
      )}

      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingProduct(p); setShowForm(true); }}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" />Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold">${p.price.toLocaleString("es-AR")}</span>
                  <span className="text-xs text-muted-foreground">/{unitLabels[p.unit] ?? p.unit}</span>
                </div>
                <Badge variant={p.inStock ? "secondary" : "destructive"} className="mt-2">{p.inStock ? "Disponible" : "Sin stock"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingProduct ? "Editar producto" : "Agregar producto"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input placeholder="Ej: Empanada de carne" defaultValue={editingProduct?.name ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Precio</Label><Input type="number" placeholder="0" defaultValue={editingProduct?.price ?? ""} /></div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select defaultValue={editingProduct?.unit ?? "unidad"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(unitLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Categoría</Label><Input placeholder="Ej: Panadería" defaultValue={editingProduct?.category ?? ""} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea placeholder="Descripción del producto..." defaultValue={editingProduct?.description ?? ""} /></div>
            <div className="space-y-2">
              <Label>% Desperdicio</Label>
              <Input type="number" placeholder="0" defaultValue={editingProduct?.waste ?? 0} />
              <p className="text-xs text-muted-foreground">Para productos vendidos por m² o kg. Se suma al cálculo final.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={() => setShowForm(false)}>{editingProduct ? "Guardar" : "Agregar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
