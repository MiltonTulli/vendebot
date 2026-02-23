"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Globe,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface SeoPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  heroImage: string | null;
  showCatalog: boolean;
  showWhatsappButton: boolean;
  published: boolean;
  createdAt: string;
}

export default function SeoPage() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    heroImage: "",
    showCatalog: true,
    showWhatsappButton: true,
    published: false,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/seo-pages");
    if (res.ok) setPages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSubmitting(true);
    const res = await fetch("/api/seo-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Página creada");
      setOpen(false);
      setForm({ slug: "", title: "", description: "", heroImage: "", showCatalog: true, showWhatsappButton: true, published: false });
      load();
    } else {
      toast.error("Error al crear página");
    }
    setSubmitting(false);
  };

  const togglePublish = async (page: SeoPage) => {
    const res = await fetch(`/api/seo-pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !page.published }),
    });
    if (res.ok) {
      toast.success(page.published ? "Página despublicada" : "Página publicada");
      load();
    }
  };

  const deletePage = async (id: string) => {
    const res = await fetch(`/api/seo-pages/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Página eliminada");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landing Pages SEO</h1>
          <p className="text-muted-foreground">
            Páginas públicas optimizadas para buscadores con tu catálogo
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nueva página</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear landing page</DialogTitle>
              <DialogDescription>
                Configurá tu página pública con catálogo y botón de WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>URL slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/tienda/</span>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    placeholder="mi-tienda"
                  />
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mi Tienda Online" />
              </div>
              <div>
                <Label>Descripción SEO</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción para Google..." rows={3} />
              </div>
              <div>
                <Label>Imagen hero (URL)</Label>
                <Input value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.showCatalog} onCheckedChange={(v) => setForm({ ...form, showCatalog: v })} />
                  <Label>Mostrar catálogo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.showWhatsappButton} onCheckedChange={(v) => setForm({ ...form, showWhatsappButton: v })} />
                  <Label>Botón WhatsApp</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Publicar inmediatamente</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tenés landing pages</p>
            <p className="text-muted-foreground">Creá una página SEO con tu catálogo para atraer clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <CardDescription>/tienda/{p.slug}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.published ? "default" : "secondary"}>
                    {p.published ? "Publicada" : "Borrador"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {p.description && <p className="text-sm text-muted-foreground mb-4">{p.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                    {p.published ? "Despublicar" : "Publicar"}
                  </Button>
                  {p.published && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/tienda/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" /> Ver
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => deletePage(p.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
