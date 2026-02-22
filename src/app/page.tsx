import { Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="flex items-center gap-3">
        <Bot className="h-12 w-12 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight">VendéBot</h1>
      </div>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Tu vendedor virtual en WhatsApp. Atendé clientes, vendé productos y
        cobrá — todo automático.
      </p>
      <Button asChild size="lg">
        <Link href="/app">Ir al Dashboard</Link>
      </Button>
    </div>
  );
}
