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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  templateName: string;
  templateBody: string;
  templateCategory: string;
  status: string;
  totalRecipients: number | null;
  sentCount: number | null;
  deliveredCount: number | null;
  readCount: number | null;
  rejectionReason: string | null;
  createdAt: string;
  sentAt: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  draft: { label: "Borrador", variant: "secondary", icon: Clock },
  pending_approval: { label: "Pendiente aprobación", variant: "outline", icon: Clock },
  approved: { label: "Aprobada", variant: "default", icon: CheckCircle },
  rejected: { label: "Rechazada", variant: "destructive", icon: XCircle },
  sending: { label: "Enviando", variant: "outline", icon: Loader2 },
  sent: { label: "Enviada", variant: "default", icon: CheckCircle },
  failed: { label: "Fallida", variant: "destructive", icon: XCircle },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    templateName: "",
    templateBody: "",
    templateCategory: "MARKETING",
  });

  const loadCampaigns = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    if (res.ok) setCampaigns(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const createCampaign = async () => {
    setSubmitting(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Campaña creada");
      setOpen(false);
      setForm({ name: "", templateName: "", templateBody: "", templateCategory: "MARKETING" });
      loadCampaigns();
    } else {
      toast.error("Error al crear campaña");
    }
    setSubmitting(false);
  };

  const submitForApproval = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/submit`, { method: "POST" });
    if (res.ok) {
      toast.success("Template enviado a Meta para aprobación");
      loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al enviar");
    }
  };

  const sendCampaign = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      toast.success(`Campaña enviada: ${result.sentCount} mensajes`);
      loadCampaigns();
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al enviar");
    }
  };

  const refreshStatus = async (id: string) => {
    const res = await fetch(`/api/campaigns/${id}/status`);
    if (res.ok) {
      toast.success("Estado actualizado");
      loadCampaigns();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas</h1>
          <p className="text-muted-foreground">
            Broadcast de WhatsApp con templates aprobados por Meta
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva campaña
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear campaña</DialogTitle>
              <DialogDescription>
                Configurá el template de WhatsApp para tu campaña de broadcast.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre de la campaña</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Promo Verano 2026"
                />
              </div>
              <div>
                <Label>Nombre del template</Label>
                <Input
                  value={form.templateName}
                  onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                  placeholder="promo_verano_2026 (sin espacios, minúsculas)"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={form.templateCategory}
                  onValueChange={(v) => setForm({ ...form, templateCategory: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="UTILITY">Utilidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cuerpo del mensaje</Label>
                <Textarea
                  value={form.templateBody}
                  onChange={(e) => setForm({ ...form, templateBody: e.target.value })}
                  placeholder="¡Hola! Tenemos una promo especial para vos..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usá {"{{1}}"}, {"{{2}}"}, etc. para variables dinámicas
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createCampaign} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tenés campañas todavía</p>
            <p className="text-muted-foreground">
              Creá tu primera campaña de WhatsApp broadcast
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const config = statusConfig[c.status] || statusConfig.draft;
            const Icon = config.icon;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription>
                      Template: {c.templateName} · {c.templateCategory}
                    </CardDescription>
                  </div>
                  <Badge variant={config.variant}>
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                    {c.templateBody}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>👥 {c.totalRecipients ?? 0} destinatarios</span>
                    <span>✉️ {c.sentCount ?? 0} enviados</span>
                    <span>✅ {c.deliveredCount ?? 0} entregados</span>
                    <span>👁️ {c.readCount ?? 0} leídos</span>
                  </div>
                  {c.rejectionReason && (
                    <p className="text-sm text-destructive mb-4">
                      Motivo de rechazo: {c.rejectionReason}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {c.status === "draft" && (
                      <Button size="sm" onClick={() => submitForApproval(c.id)}>
                        <Send className="mr-1 h-3 w-3" /> Enviar para aprobación
                      </Button>
                    )}
                    {c.status === "pending_approval" && (
                      <Button size="sm" variant="outline" onClick={() => refreshStatus(c.id)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Verificar estado
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button size="sm" onClick={() => sendCampaign(c.id)}>
                        <Megaphone className="mr-1 h-3 w-3" /> Enviar campaña
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
