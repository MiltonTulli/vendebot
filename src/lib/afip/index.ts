/**
 * AFIP/ARCA Integration via @afipsdk/afip.js
 *
 * Handles electronic invoicing (Factura Electrónica) for Argentine businesses.
 * Supports invoice types A, B, and C based on fiscal conditions.
 */

import Afip from "@afipsdk/afip.js";

// IVA conditions for determining invoice type
export type IvaCondition =
  | "responsable_inscripto"
  | "monotributista"
  | "exento"
  | "consumidor_final"
  | "no_responsable";

// Invoice type determination matrix
// Seller RI → Buyer RI = A | Buyer CF/Mono/Exento = B
// Seller Mono → always C
export function determineInvoiceType(
  sellerIvaCondition: IvaCondition,
  buyerIvaCondition: IvaCondition
): "A" | "B" | "C" {
  if (sellerIvaCondition === "monotributista") return "C";
  if (sellerIvaCondition === "responsable_inscripto") {
    if (buyerIvaCondition === "responsable_inscripto") return "A";
    return "B";
  }
  // Exento sellers issue C
  return "C";
}

// AFIP voucher type codes
const VOUCHER_TYPE_MAP: Record<string, number> = {
  "A": 1,   // Factura A
  "B": 6,   // Factura B
  "C": 11,  // Factura C
};

// IVA condition codes for AFIP
const IVA_CONDITION_CODES: Record<IvaCondition, number> = {
  responsable_inscripto: 1,
  monotributista: 6,
  exento: 4,
  consumidor_final: 5,
  no_responsable: 5,
};

// Doc type codes
const DOC_TYPE = {
  CUIT: 80,
  DNI: 96,
  SIN_IDENTIFICAR: 99,
};

export interface AfipConfig {
  cuit: string;
  cert: string;
  key: string;
  production?: boolean;
}

export interface InvoiceData {
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  invoiceType: "A" | "B" | "C";
  buyerCuit?: string;
  buyerDni?: string;
  buyerName?: string;
  buyerIvaCondition: IvaCondition;
  pointOfSale: number;
  concept?: number; // 1=Products, 2=Services, 3=Both
}

export interface InvoiceResult {
  cae: string;
  caeExpiry: Date;
  voucherNumber: number;
  pointOfSale: number;
  invoiceType: "A" | "B" | "C";
}

/**
 * Create an AFIP client instance for a tenant.
 */
export function createAfipClient(config: AfipConfig): Afip {
  return new Afip({
    CUIT: config.cuit,
    cert: config.cert,
    key: config.key,
    production: config.production ?? false,
    // Access token cache dir (serverless-friendly: use /tmp)
    res_folder: "/tmp/afip_res/",
    ta_folder: "/tmp/afip_ta/",
  });
}

/**
 * Generate an electronic invoice and get the CAE.
 */
export async function generateInvoice(
  afip: Afip,
  data: InvoiceData
): Promise<InvoiceResult> {
  const voucherType = VOUCHER_TYPE_MAP[data.invoiceType];

  // Get last voucher number
  const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
    data.pointOfSale,
    voucherType
  );
  const nextVoucher = lastVoucher + 1;

  // Determine document type and number
  let docType = DOC_TYPE.SIN_IDENTIFICAR;
  let docNumber = 0;

  if (data.buyerCuit) {
    docType = DOC_TYPE.CUIT;
    docNumber = parseInt(data.buyerCuit.replace(/-/g, ""), 10);
  } else if (data.buyerDni) {
    docType = DOC_TYPE.DNI;
    docNumber = parseInt(data.buyerDni.replace(/\./g, ""), 10);
  }

  // For invoice A, CUIT is required
  if (data.invoiceType === "A" && docType !== DOC_TYPE.CUIT) {
    throw new Error("Factura A requiere CUIT del comprador");
  }

  // For invoice B with amount > 75,598.49 (2024 limit), need identification
  // For simplicity, if B and no doc and amount > threshold, use DNI or skip

  const today = new Date();
  const dateStr = formatAfipDate(today);
  const concept = data.concept ?? 1; // Default: Products

  // Build voucher data
  const voucherData: Record<string, unknown> = {
    CantReg: 1,
    PtoVta: data.pointOfSale,
    CbteTipo: voucherType,
    Concepto: concept,
    DocTipo: docType,
    DocNro: docNumber,
    CbteDesde: nextVoucher,
    CbteHasta: nextVoucher,
    CbteFch: dateStr,
    ImpTotal: data.totalAmount,
    ImpTotConc: 0, // Non-taxable amount
    ImpNeto: data.totalAmount, // Net amount (for C invoices, same as total)
    ImpOpEx: 0, // Exempt amount
    ImpIVA: 0, // IVA amount
    ImpTrib: 0, // Other taxes
    MonId: "PES", // Argentine Peso
    MonCotiz: 1, // Exchange rate
  };

  // For services or mixed, add service dates
  if (concept === 2 || concept === 3) {
    voucherData.FchServDesde = dateStr;
    voucherData.FchServHasta = dateStr;
    voucherData.FchVtoPago = dateStr;
  }

  // For type A invoices, add IVA breakdown (21%)
  if (data.invoiceType === "A") {
    const netAmount = parseFloat((data.totalAmount / 1.21).toFixed(2));
    const ivaAmount = parseFloat((data.totalAmount - netAmount).toFixed(2));
    voucherData.ImpNeto = netAmount;
    voucherData.ImpIVA = ivaAmount;
    voucherData.Iva = [
      {
        Id: 5, // 21%
        BaseImp: netAmount,
        Importe: ivaAmount,
      },
    ];
  }

  // Create the voucher
  const result = await afip.ElectronicBilling.createVoucher(voucherData);

  // Parse CAE expiry
  const caeExpiry = parseAfipDate(result.CAEFchVto);

  return {
    cae: result.CAE,
    caeExpiry,
    voucherNumber: nextVoucher,
    pointOfSale: data.pointOfSale,
    invoiceType: data.invoiceType,
  };
}

/**
 * Get available points of sale for a CUIT.
 */
export async function getPointsOfSale(afip: Afip) {
  return afip.ElectronicBilling.getSalesPoints();
}

// Helpers
function formatAfipDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function parseAfipDate(s: string): Date {
  const year = parseInt(s.slice(0, 4), 10);
  const month = parseInt(s.slice(4, 6), 10) - 1;
  const day = parseInt(s.slice(6, 8), 10);
  return new Date(year, month, day);
}

export { IVA_CONDITION_CODES };
