"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: string;
  orderId: string | null;
  invoiceType: "A" | "B" | "C";
  cae: string | null;
  caeExpiry: string | null;
  pointOfSale: number | null;
  invoiceNumber: number | null;
  totalAmount: string;
  hasPdf: boolean;
  createdAt: string;
  customerName: string | null;
  orderStatus: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/invoices?page=${page}&limit=20&status=${filter}`
      );
      const data = await res.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownload = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/download`, "_blank");
  };

  const handleSendWhatsApp = async (invoiceId: string) => {
    setSendingWhatsApp(invoiceId);
    try {
      const res = await fetch("/api/invoices/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al enviar");
      }
    } catch (err) {
      console.error("Error sending WhatsApp:", err);
      alert("Error al enviar por WhatsApp");
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const formatInvoiceNumber = (pv: number | null, num: number | null) => {
    if (!pv && !num) return "—";
    const pvStr = String(pv || 1).padStart(5, "0");
    const numStr = String(num || 0).padStart(8, "0");
    return `${pvStr}-${numStr}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
          <p className="text-muted-foreground">
            Facturas electrónicas emitidas por ARCA/AFIP
          </p>
        </div>
        <Button variant="outline" onClick={fetchInvoices} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con CAE</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((i) => i.cae).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${invoices
                .reduce((sum, i) => sum + parseFloat(i.totalAmount || "0"), 0)
                .toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="completed">Con CAE</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Facturas</CardTitle>
          <CardDescription>
            Facturas electrónicas con CAE de ARCA/AFIP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No hay facturas</p>
              <p className="text-sm">
                Las facturas se generan automáticamente al confirmar pagos.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>CAE</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.invoiceType === "A"
                              ? "default"
                              : invoice.invoiceType === "B"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {invoice.invoiceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatInvoiceNumber(
                          invoice.pointOfSale,
                          invoice.invoiceNumber
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.customerName || "Consumidor Final"}
                      </TableCell>
                      <TableCell>
                        ${parseFloat(invoice.totalAmount).toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.cae ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-mono text-xs">
                              {invoice.cae.slice(0, 8)}...
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              Pendiente
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString(
                          "es-AR"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.hasPdf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(invoice.id)}
                              title="Descargar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendWhatsApp(invoice.id)}
                            disabled={sendingWhatsApp === invoice.id}
                            title="Enviar por WhatsApp"
                          >
                            <Send
                              className={`h-4 w-4 ${
                                sendingWhatsApp === invoice.id
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages} ({pagination.total} facturas)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(pagination.totalPages, p + 1)
                        )
                      }
                      disabled={page >= pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
