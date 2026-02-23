"use client";

import { useState } from "react";
import {
  Bot,
  Building2,
  MessageSquare,
  Package,
  Palette,
  TestTube,
  Rocket,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const steps = [
  { icon: Building2, title: "Tu negocio", description: "Información básica" },
  { icon: MessageSquare, title: "WhatsApp", description: "Conectá tu número" },
  { icon: Package, title: "Catálogo", description: "Subí tus productos" },
  { icon: Palette, title: "Personalizar", description: "Estilo del bot" },
  { icon: TestTube, title: "Probar", description: "Testeá tu bot" },
  { icon: Rocket, title: "¡En vivo!", description: "Activá tu bot" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    hours: "",
    description: "",
    deliveryZones: "",
    whatsappNumber: "",
    botPersonality: "Sos un vendedor amable y eficiente. Respondé en español rioplatense, con tono cercano y profesional.",
  });

  const progress = ((step + 1) / steps.length) * 100;

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurar VendéBot</h1>
        <p className="text-sm text-muted-foreground">
          Paso {step + 1} de {steps.length} — {steps[step].title}
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className={`flex flex-col items-center gap-1 ${
              i <= step ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? "border-2 border-primary bg-background"
                  : "border bg-muted"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
            </div>
            <span className="hidden text-xs sm:block">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5" />; })()}
            {steps[step].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Nombre del negocio</Label>
                <Input
                  placeholder="Ej: Panadería Don Carlos"
                  value={formData.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horarios de atención</Label>
                <Input
                  placeholder="Ej: Lunes a Sábado 8:00 - 20:00"
                  value={formData.hours}
                  onChange={(e) => update("hours", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción del negocio</Label>
                <Textarea
                  placeholder="Contanos qué vendés, qué te diferencia..."
                  value={formData.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Zonas de entrega</Label>
                <Input
                  placeholder="Ej: CABA, Zona Norte, Zona Oeste"
                  value={formData.deliveryZones}
                  onChange={(e) => update("deliveryZones", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Número de WhatsApp del negocio</Label>
                <Input
                  placeholder="+54 9 11 1234-5678"
                  value={formData.whatsappNumber}
                  onChange={(e) => update("whatsappNumber", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Este es el número que usarán tus clientes para hablar con el bot.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 font-medium">Cómo conectar WhatsApp</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Ingresá el número de tu negocio arriba</li>
                  <li>2. Te enviaremos un código de verificación por WhatsApp</li>
                  <li>3. Ingresá el código para confirmar</li>
                </ol>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Subí tu catálogo</p>
                  <p className="text-sm text-muted-foreground">
                    CSV, Excel (.xlsx) o conectá Google Sheets
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Subir archivo
                  </Button>
                  <Button variant="outline" size="sm">
                    Conectar Google Sheets
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: nombre, precio, unidad (kg/unidad/m²/etc), categoría, descripción.
                También podés agregar productos manualmente desde el catálogo.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Personalidad del bot</Label>
                <Textarea
                  rows={5}
                  placeholder="Describí cómo querés que hable tu bot..."
                  value={formData.botPersonality}
                  onChange={(e) => update("botPersonality", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Esto define el tono y estilo de las respuestas. Podés cambiarlo después.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 text-sm font-medium">Ejemplo de conversación</h4>
                <div className="space-y-2 text-sm">
                  <div className="rounded-lg bg-background p-2">
                    <span className="font-medium">Cliente:</span> Hola, tienen empanadas?
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <span className="font-medium">Bot:</span> ¡Hola! Sí, tenemos empanadas de carne, pollo, jamón y queso, y verdura. La docena sale $8.500. ¿Cuántas querés?
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-6 text-center">
                <TestTube className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h4 className="mb-1 font-medium">Probá tu bot</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Enviá un mensaje de prueba al número configurado para ver cómo responde.
                </p>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Abrir WhatsApp de prueba
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 text-sm font-medium">Checklist</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Datos del negocio configurados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    WhatsApp conectado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Catálogo cargado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Bot personalizado
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Rocket className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold">¡Todo listo!</h3>
              <p className="max-w-sm text-muted-foreground">
                Tu VendéBot está configurado y listo para atender clientes.
                Podés hacer ajustes en cualquier momento desde el dashboard.
              </p>
              <Button asChild>
                <a href="/app">Ir al Dashboard</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            {step === 4 ? "Activar bot" : "Siguiente"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
