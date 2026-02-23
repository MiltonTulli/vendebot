import {
  Bot,
  MessageSquare,
  ShoppingCart,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    title: "Atención 24/7",
    description:
      "Tu bot responde consultas, toma pedidos y cobra por WhatsApp. Sin pausas, sin feriados.",
  },
  {
    icon: ShoppingCart,
    title: "Pedidos automáticos",
    description:
      "Los clientes arman su pedido conversando. El bot calcula precios, aplica descuentos y genera el link de pago.",
  },
  {
    icon: Zap,
    title: "Catálogo inteligente",
    description:
      "Subí tu lista de productos y el bot aprende a venderlos. Soporta kg, m², docenas y más.",
  },
  {
    icon: Clock,
    title: "Setup en minutos",
    description:
      "Conectá tu WhatsApp, subí tu catálogo y listo. Sin código, sin complicaciones.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard completo",
    description:
      "Seguí tus ventas, pedidos, conversaciones y clientes en tiempo real desde un solo lugar.",
  },
  {
    icon: Shield,
    title: "Facturación ARCA",
    description:
      "Emitimos facturas A, B y C automáticamente. Integración directa con AFIP/ARCA.",
  },
];

const steps = [
  { step: "1", title: "Registrate", description: "Creá tu cuenta en 30 segundos." },
  { step: "2", title: "Conectá WhatsApp", description: "Vinculá tu número de negocio." },
  { step: "3", title: "Subí tu catálogo", description: "CSV, Excel o Google Sheets." },
  { step: "4", title: "¡Vendé!", description: "Tu bot empieza a atender clientes." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">VendéBot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Empezar gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5" />
          Para negocios argentinos
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Tu vendedor en WhatsApp que{" "}
          <span className="text-primary">nunca descansa</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          VendéBot atiende consultas, toma pedidos, calcula precios y cobra por
          MercadoPago — todo desde WhatsApp, las 24 horas.
        </p>
        <div className="flex gap-3">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#como-funciona">Ver cómo funciona</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Todo lo que necesitás para vender por WhatsApp
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border bg-background">
                <CardContent className="flex flex-col gap-3 p-6">
                  <f.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Arrancá en 4 pasos
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">
            ¿Listo para automatizar tus ventas?
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Unite a los negocios que ya venden en piloto automático con VendéBot.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/sign-up">
              Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>VendéBot</span>
          </div>
          <p>Hecho en 🇦🇷 Argentina</p>
        </div>
      </footer>
    </div>
  );
}
