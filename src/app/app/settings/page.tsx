"use client";

import { useState } from "react";
import {
  Building2,
  Bot,
  Clock,
  Bell,
  Save,
  MessageSquare,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Ajustes de tu negocio y bot
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {saved ? "¡Guardado!" : "Guardar cambios"}
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
                  <Input defaultValue="Panadería Don Carlos" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp del negocio</Label>
                  <Input defaultValue="+54 9 11 1234-5678" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input defaultValue="Av. Corrientes 1234, CABA" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  defaultValue="Panadería artesanal con más de 20 años en el barrio. Hacemos pan, facturas, medialunas, tortas y empanadas."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Zonas de entrega</Label>
                <Input defaultValue="CABA, Zona Norte" />
                <p className="text-xs text-muted-foreground">
                  Separar por comas
                </p>
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
                  defaultValue="Sos un vendedor amable y eficiente de Panadería Don Carlos. Respondé en español rioplatense, con tono cercano y profesional. Ayudá a los clientes a elegir productos, armá pedidos y calculá precios. Si no sabés algo, ofrecé pasar la consulta al dueño."
                />
                <p className="text-xs text-muted-foreground">
                  Esto define cómo se comporta tu bot. Podés ajustarlo cuando quieras.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mensaje de bienvenida</Label>
                <Textarea
                  rows={3}
                  defaultValue="¡Hola! 👋 Soy el asistente de Panadería Don Carlos. ¿En qué te puedo ayudar? Podés consultarme el menú, hacer un pedido o preguntar por entregas."
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje fuera de horario</Label>
                <Textarea
                  rows={2}
                  defaultValue="¡Hola! En este momento estamos cerrados. Nuestro horario es de Lunes a Sábado de 8 a 20hs. ¡Te esperamos! 🕐"
                />
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Vista previa
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="rounded-lg bg-background p-2 text-muted-foreground">
                    Cliente: Hola, qué tienen hoy?
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    Bot: ¡Hola! 👋 Hoy tenemos pan lactal ($3.200), facturas surtidas ($5.800/docena), medialunas ($4.500/docena) y empanadas de carne ($850 c/u). ¿Qué te tienta?
                  </div>
                </div>
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
              {[
                { day: "Lunes", from: "08:00", to: "20:00", enabled: true },
                { day: "Martes", from: "08:00", to: "20:00", enabled: true },
                { day: "Miércoles", from: "08:00", to: "20:00", enabled: true },
                { day: "Jueves", from: "08:00", to: "20:00", enabled: true },
                { day: "Viernes", from: "08:00", to: "20:00", enabled: true },
                { day: "Sábado", from: "08:00", to: "14:00", enabled: true },
                { day: "Domingo", from: "", to: "", enabled: false },
              ].map((d) => (
                <div
                  key={d.day}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <Switch defaultChecked={d.enabled} />
                  <span className="w-24 text-sm font-medium">{d.day}</span>
                  {d.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        defaultValue={d.from}
                        className="w-28 h-8"
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        defaultValue={d.to}
                        className="w-28 h-8"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <Switch defaultChecked />
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
                {
                  title: "Nuevo pedido",
                  desc: "Recibí una notificación cuando un cliente hace un pedido",
                  enabled: true,
                },
                {
                  title: "Conversación escalada",
                  desc: "Cuando el bot no puede resolver y escala a humano",
                  enabled: true,
                },
                {
                  title: "Pago recibido",
                  desc: "Cuando un cliente completa el pago",
                  enabled: true,
                },
                {
                  title: "Stock bajo",
                  desc: "Cuando un producto está por quedarse sin stock",
                  enabled: false,
                },
                {
                  title: "Resumen diario",
                  desc: "Resumen de ventas y conversaciones del día",
                  enabled: true,
                },
              ].map((n) => (
                <div
                  key={n.title}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Switch defaultChecked={n.enabled} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>WhatsApp para notificaciones</Label>
                <Input defaultValue="+54 9 11 1234-5678" />
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
                      <p className="text-xs text-muted-foreground">
                        Conectá tu cuenta para recibir pagos online
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <a href="/api/mercadopago/oauth">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Conectar cuenta
                    </a>
                  </Button>
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
