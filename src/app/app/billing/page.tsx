"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  priceArs: number;
  currentPeriodEnd: string | null;
}

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 15000,
    features: [
      "Hasta 500 mensajes/mes",
      "50 productos",
      "1 campaña/mes",
      "Bot con IA",
      "Dashboard básico",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 35000,
    popular: true,
    features: [
      "Hasta 3.000 mensajes/mes",
      "500 productos",
      "10 campañas/mes",
      "Bot con IA avanzado",
      "Analytics completo",
      "Integraciones",
      "Facturación ARCA",
    ],
  },
  {
    id: "business" as const,
    name: "Business",
    price: 75000,
    features: [
      "Mensajes ilimitados",
      "Productos ilimitados",
      "Campañas ilimitadas",
      "Bot con IA premium",
      "Analytics avanzado",
      "Todas las integraciones",
      "Facturación ARCA",
      "Soporte prioritario",
      "API personalizada",
    ],
  },
];

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  authorized: { label: "Activa", variant: "default" },
  pending: { label: "Pendiente", variant: "outline" },
  paused: { label: "Pausada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing/status");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subscribe = async (planId: string) => {
    setSubscribing(planId);
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });

    if (res.ok) {
      const data = await res.json();
      // Redirect to MercadoPago checkout
      window.location.href = data.initPoint;
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al suscribirse");
    }
    setSubscribing(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground">
          Gestioná tu suscripción a VendéBot
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Tu suscripción actual
              </CardTitle>
              <Badge variant={statusLabels[subscription.status]?.variant || "outline"}>
                {statusLabels[subscription.status]?.label || subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-semibold capitalize">Plan {subscription.plan}</p>
                <p className="text-sm text-muted-foreground">
                  {formatARS(subscription.priceArs)}/mes
                </p>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="text-sm text-muted-foreground">
                  Próximo cobro:{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-AR")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan === plan.id && subscription.status === "authorized";
          return (
            <Card
              key={plan.id}
              className={plan.popular ? "border-primary shadow-lg relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1">
                    <Sparkles className="h-3 w-3" /> Más popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {formatARS(plan.price)}
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" disabled variant="outline">
                    Plan actual
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => subscribe(plan.id)}
                    disabled={!!subscribing}
                  >
                    {subscribing === plan.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {subscription ? "Cambiar plan" : "Suscribirse"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            Los pagos se procesan de forma segura a través de MercadoPago.
            Podés cancelar tu suscripción en cualquier momento desde tu cuenta de MercadoPago.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
