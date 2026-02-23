"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Bot,
  Clock,
  Bell,
  Save,
  MessageSquare,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface BusinessInfo {
  address?: string;
  hours?: string;
  deliveryZones?: string[];
  description?: string;
  ivaCondition?: string;
  welcomeMessage?: string;
  offHoursMessage?: string;
  schedule?: Array<{ day: string; from: string; to: string; enabled: boolean }>;
  notifications?: Record<string, boolean>;
  botOutOfHours?: boolean;
}

interface TenantSettings {
  businessName: string;
  whatsappNumber: string;
  ownerPhoneNumber: string;
  botPersonality: string;
  businessInfo: BusinessInfo;
  mercadopagoConnected: boolean;
  mercadopagoUserId: string | null;
}

const defaultSchedule = [
  { day: "Lunes", from: "08:00", to: "20:00", enabled: true },
  { day: "Martes", from: "08:00", to: "20:00", enabled: true },
  { day: "Miércoles", from: "08:00", to: "20:00", enabled: true },
  { day: "Jueves", from: "08:00", to: "20:00", enabled: true },
  { day: "Viernes", from: "08:00", to: "20:00", enabled: true },
  { day: "Sábado", from: "08:00", to: "14:00", enabled: true },
  { day: "Domingo", from: "", to: "", enabled: false },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  // Editable fields
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryZones, setDeliveryZones] = useState("");
  const [botPersonality, setBotPersonality] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [offHoursMessage, setOffHoursMessage] = useState("");
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [botOutOfHours, setBotOutOfHours] = useState(true);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    newOrder: true,
    escalated: true,
    payment: true,
    lowStock: false,
    dailySummary: true,
  });

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const data: TenantSettings = await res.json();
      setSettings(data);
      setBusinessName(data.businessName);
      setWhatsappNumber(data.whatsappNumber);
      setOwnerPhoneNumber(data.ownerPhoneNumber);
      setAddress(data.businessInfo?.address ?? "");
      setDescription(data.businessInfo?.description ?? "");
      setDeliveryZones(data.businessInfo?.deliveryZones?.join(", ") ?? "");
      setBotPersonality(data.botPersonality);
      setWelcomeMessage(data.businessInfo?.welcomeMessage ?? "");
      setOffHoursMessage(data.businessInfo?.offHoursMessage ?? "");
      if (data.businessInfo?.schedule?.length) {
        setSchedule(data.businessInfo.schedule);
      }
      if (data.businessInfo?.notifications) {
        setNotifications(data.businessInfo.notifications);
      }
      setBotOutOfHours(data.businessInfo?.botOutOfHours ?? true);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          whatsappNumber,
          ownerPhoneNumber,
          botPersonality,
          businessInfo: {
            address,
            description,
            deliveryZones: deliveryZones.split(",").map((z) => z.trim()).filter(Boolean),
            welcomeMessage,
            offHoursMessage,
            schedule,
            notifications,
            botOutOfHours,
            hours: settings?.businessInfo?.hours,
            ivaCondition: settings?.businessInfo?.ivaCondition,
          },
        }),
      });
      if (res.ok) {
        toast.success("Configuración guardada");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Ajustes de tu negocio y bot
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="mr-2 h-4 w-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="bot">
            <Bot className="mr-2 h-4 w-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="mr-2 h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* Business info */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del negocio</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp del negocio</Label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Zonas de entrega</Label>
                <Input value={deliveryZones} onChange={(e) => setDeliveryZones(e.target.value)} />
                <p className="text-xs text-muted-foreground">Separar por comas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot personality */}
        <TabsContent value="bot">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personalidad del bot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Instrucciones del sistema</Label>
                <Textarea
                  rows={6}
                  value={botPersonality}
                  onChange={(e) => setBotPersonality(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Esto define cómo se comporta tu bot. Podés ajustarlo cuando quieras.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mensaje de bienvenida</Label>
                <Textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje fuera de horario</Label>
                <Textarea
                  rows={2}
                  value={offHoursMessage}
                  onChange={(e) => setOffHoursMessage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Horarios de atención</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.map((d, idx) => (
                <div key={d.day} className="flex items-center gap-4 rounded-lg border p-3">
                  <Switch
                    checked={d.enabled}
                    onCheckedChange={(checked) => {
                      const copy = [...schedule];
                      copy[idx] = { ...copy[idx], enabled: checked };
                      setSchedule(copy);
                    }}
                  />
                  <span className="w-24 text-sm font-medium">{d.day}</span>
                  {d.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={d.from}
                        className="w-28 h-8"
                        onChange={(e) => {
                          const copy = [...schedule];
                          copy[idx] = { ...copy[idx], from: e.target.value };
                          setSchedule(copy);
                        }}
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={d.to}
                        className="w-28 h-8"
                        onChange={(e) => {
                          const copy = [...schedule];
                          copy[idx] = { ...copy[idx], to: e.target.value };
                          setSchedule(copy);
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <Switch checked={botOutOfHours} onCheckedChange={setBotOutOfHours} />
                <div>
                  <p className="text-sm font-medium">Bot fuera de horario</p>
                  <p className="text-xs text-muted-foreground">
                    El bot responde con el mensaje configurado fuera del horario de atención
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "newOrder", title: "Nuevo pedido", desc: "Recibí una notificación cuando un cliente hace un pedido" },
                { key: "escalated", title: "Conversación escalada", desc: "Cuando el bot no puede resolver y escala a humano" },
                { key: "payment", title: "Pago recibido", desc: "Cuando un cliente completa el pago" },
                { key: "lowStock", title: "Stock bajo", desc: "Cuando un producto está por quedarse sin stock" },
                { key: "dailySummary", title: "Resumen diario", desc: "Resumen de ventas y conversaciones del día" },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[n.key] ?? false}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [n.key]: checked }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>WhatsApp para notificaciones</Label>
                <Input value={ownerPhoneNumber} onChange={(e) => setOwnerPhoneNumber(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Número donde recibir las notificaciones del bot
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments (MercadoPago) */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">MercadoPago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">MercadoPago</p>
                      {settings?.mercadopagoConnected ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Conectado{settings.mercadopagoUserId ? ` (ID: ${settings.mercadopagoUserId})` : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Conectá tu cuenta para recibir pagos online
                        </p>
                      )}
                    </div>
                  </div>
                  {!settings?.mercadopagoConnected && (
                    <Button asChild>
                      <a href="/api/mercadopago/oauth">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Conectar cuenta
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Al conectar MercadoPago:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Se generará un link de pago automático con cada pedido confirmado</li>
                  <li>El bot enviará el link al cliente por WhatsApp</li>
                  <li>Cuando el pago se acredite, el pedido se confirma automáticamente</li>
                  <li>Recibirás una notificación por WhatsApp de cada pago recibido</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
