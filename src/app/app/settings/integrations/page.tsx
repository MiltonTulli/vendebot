"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  ShoppingBag,
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IntegrationStatus {
  tiendanube: { connected: boolean; storeId: string; lastSync: string | null };
  mercadolibre: { connected: boolean; userId: string; lastSync: string | null };
  externalDb: { connected: boolean; type: string; lastSync: string | null; config: Record<string, unknown> | null };
}

export default function IntegrationsPage() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/status");
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSync = async (provider: string) => {
    setSyncing(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [provider]: data.success
          ? `✅ ${data.synced} productos sincronizados`
          : `❌ ${data.error}`,
      }));
    } catch {
      setResults((prev) => ({ ...prev, [provider]: "❌ Error de conexión" }));
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-sm text-muted-foreground">
          Conectá tu tienda online y sincronizá productos automáticamente
        </p>
      </div>

      {/* Tiendanube */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5 text-blue-500" />
            Tiendanube
            {status?.tiendanube.connected && (
              <Badge className="bg-green-100 text-green-700 ml-2"><CheckCircle className="mr-1 h-3 w-3" />Conectado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sincronizá productos, stock y pedidos con tu tienda de Tiendanube.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Store ID</Label>
              <Input placeholder="123456" />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input type="password" placeholder="Token de acceso" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSync("tiendanube")}
              disabled={syncing === "tiendanube"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  syncing === "tiendanube" ? "animate-spin" : ""
                }`}
              />
              Sincronizar ahora
            </Button>
            {results.tiendanube && (
              <span className="text-sm">{results.tiendanube}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MercadoLibre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-yellow-500" />
            MercadoLibre
            {status?.mercadolibre.connected && (
              <Badge className="bg-green-100 text-green-700 ml-2"><CheckCircle className="mr-1 h-3 w-3" />Conectado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sincronizá tus publicaciones y stock de MercadoLibre.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <a href="/api/integrations/mercadolibre/oauth">
                <ExternalLink className="mr-2 h-4 w-4" />
                Conectar cuenta
              </a>
            </Button>
            <Button
              onClick={() => handleSync("mercadolibre")}
              disabled={syncing === "mercadolibre"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  syncing === "mercadolibre" ? "animate-spin" : ""
                }`}
              />
              Sincronizar
            </Button>
            {results.mercadolibre && (
              <span className="text-sm">{results.mercadolibre}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* External Database */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-green-500" />
            Base de datos externa
            {status?.externalDb.connected && (
              <Badge className="bg-green-100 text-green-700 ml-2"><CheckCircle className="mr-1 h-3 w-3" />Conectado ({status.externalDb.type})</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conectá una base de datos PostgreSQL o MySQL para importar productos.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue="postgresql">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL de conexión</Label>
              <Input
                type="password"
                placeholder="postgresql://user:pass@host/db"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Query SQL (solo lectura)</Label>
            <Textarea
              rows={3}
              placeholder="SELECT name, price, stock, category FROM products WHERE active = true"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Campo nombre</Label>
              <Input placeholder="name" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Campo precio</Label>
              <Input placeholder="price" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Campo stock</Label>
              <Input placeholder="stock" className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Campo categoría</Label>
              <Input placeholder="category" className="h-8" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">Probar conexión</Button>
            <Button
              onClick={() => handleSync("external-db")}
              disabled={syncing === "external-db"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  syncing === "external-db" ? "animate-spin" : ""
                }`}
              />
              Importar productos
            </Button>
            {results["external-db"] && (
              <span className="text-sm">{results["external-db"]}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
