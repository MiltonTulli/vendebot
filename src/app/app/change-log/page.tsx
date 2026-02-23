"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Clock,
  Plus,
  Minus,
  Megaphone,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChangeLog {
  id: string;
  action: string;
  description: string;
  details: Record<string, unknown> | null;
  source: string;
  createdAt: string;
}

const actionConfig: Record<
  string,
  { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  update_price: { label: "Precio", icon: DollarSign, variant: "default" },
  update_hours: { label: "Horario", icon: Clock, variant: "secondary" },
  add_product: { label: "Producto nuevo", icon: Plus, variant: "default" },
  remove_product: { label: "Producto removido", icon: Minus, variant: "destructive" },
  update_product: { label: "Producto actualizado", icon: Activity, variant: "secondary" },
  broadcast: { label: "Broadcast", icon: Megaphone, variant: "outline" },
  other: { label: "Otro", icon: Activity, variant: "outline" },
};

export default function ChangeLogPage() {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/change-logs?limit=50");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch (error) {
      console.error("Error fetching change logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Registro de cambios
          </h1>
          <p className="text-muted-foreground">
            Historial de cambios realizados por WhatsApp y el dashboard
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cambios recientes</CardTitle>
          <CardDescription>
            Últimas modificaciones al catálogo, horarios y configuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sin cambios registrados</p>
              <p className="text-sm">
                Los cambios realizados por WhatsApp o el dashboard aparecerán acá
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Origen</TableHead>
                  <TableHead className="w-[180px]">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const config = actionConfig[log.action] ?? actionConfig.other;
                  const Icon = config.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.source === "whatsapp" ? "📱 WhatsApp" : "💻 Dashboard"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
