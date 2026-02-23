"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Key,
  FileText,
} from "lucide-react";

export default function InvoicingSettingsPage() {
  const [configured, setConfigured] = useState(false);
  const [cuit, setCuit] = useState("");
  const [maskedCuit, setMaskedCuit] = useState<string | null>(null);
  const [ivaCondition, setIvaCondition] = useState("monotributista");
  const [cert, setCert] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    fetch("/api/afip/setup")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured);
        setMaskedCuit(data.cuit);
        if (data.ivaCondition) setIvaCondition(data.ivaCondition);
        setIsProduction(data.production);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/afip/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cert, key: privateKey, cuit, ivaCondition }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      setSuccess(data.message);
      setConfigured(true);
      setCert("");
      setPrivateKey("");
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (
    type: "cert" | "key",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      if (type === "cert") setCert(content);
      else setPrivateKey(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturación Electrónica</h1>
        <p className="text-muted-foreground">
          Configurá ARCA/AFIP para emitir facturas electrónicas
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Estado
            {configured ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Configurado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="mr-1 h-3 w-3" /> No configurado
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isProduction ? "Entorno de producción" : "Entorno de homologación (testing)"}
          </CardDescription>
        </CardHeader>
        {configured && maskedCuit && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              CUIT: {maskedCuit} · Condición IVA:{" "}
              {ivaCondition === "responsable_inscripto"
                ? "Responsable Inscripto"
                : ivaCondition === "monotributista"
                ? "Monotributista"
                : "Exento"}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Guía: Generar Certificado AFIP
          </CardTitle>
          <CardDescription>
            Seguí estos pasos para obtener tu certificado digital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0">
                1
              </Badge>
              <div>
                <p className="font-medium">Generar clave privada (CSR)</p>
                <p className="text-muted-foreground">
                  Ejecutá en tu terminal:
                </p>
                <code className="mt-1 block rounded bg-muted p-2 text-xs">
                  openssl genrsa -out private.key 2048
                </code>
                <code className="mt-1 block rounded bg-muted p-2 text-xs">
                  openssl req -new -key private.key -subj
                  &quot;/C=AR/O=TuEmpresa/CN=TuEmpresa/serialNumber=CUIT
                  XXXXXXXXXXX&quot; -out request.csr
                </code>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0">
                2
              </Badge>
              <div>
                <p className="font-medium">Subir CSR a ARCA/AFIP</p>
                <p className="text-muted-foreground">
                  Ingresá a AFIP con tu CUIT y clave fiscal:
                </p>
                <a
                  href="https://auth.afip.gob.ar/contribuyente_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                >
                  AFIP - Administración Federal
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="mt-1 text-muted-foreground">
                  Ir a: Administración de Certificados Digitales →
                  Agregar alias → Subir el archivo <code>request.csr</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0">
                3
              </Badge>
              <div>
                <p className="font-medium">Descargar certificado</p>
                <p className="text-muted-foreground">
                  Una vez aprobado, descargá el archivo <code>.crt</code> desde
                  AFIP y subilo junto con la clave privada aquí abajo.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Badge variant="outline" className="h-6 w-6 shrink-0 items-center justify-center rounded-full p-0">
                4
              </Badge>
              <div>
                <p className="font-medium">
                  {isProduction ? "Producción" : "Homologación (Testing)"}
                </p>
                <p className="text-muted-foreground">
                  {isProduction
                    ? "Estás en modo producción. Las facturas se emiten en el entorno real de AFIP."
                    : "Estás en modo homologación. Las facturas se emiten en el entorno de testing de AFIP. Ideal para probar antes de ir a producción."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {configured ? "Actualizar Credenciales" : "Configurar AFIP"}
          </CardTitle>
          <CardDescription>
            Tus credenciales se almacenan encriptadas y nunca se comparten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  placeholder="20-12345678-9"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ivaCondition">Condición IVA</Label>
                <Select value={ivaCondition} onValueChange={setIvaCondition}>
                  <SelectTrigger id="ivaCondition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="responsable_inscripto">
                      Responsable Inscripto
                    </SelectItem>
                    <SelectItem value="monotributista">
                      Monotributista
                    </SelectItem>
                    <SelectItem value="exento">Exento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cert">
                Certificado (.crt)
              </Label>
              <Input
                id="certFile"
                type="file"
                accept=".crt,.pem,.cer"
                onChange={(e) => handleFileUpload("cert", e)}
              />
              <Textarea
                id="cert"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={cert}
                onChange={(e) => setCert(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">
                Clave Privada (.key)
              </Label>
              <Input
                id="keyFile"
                type="file"
                accept=".key,.pem"
                onChange={(e) => handleFileUpload("key", e)}
              />
              <Textarea
                id="key"
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <Button type="submit" disabled={saving || !cert || !privateKey || !cuit}>
              {saving ? "Verificando conexión..." : "Guardar y Verificar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
