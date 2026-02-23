/**
 * Invoice PDF Generator
 *
 * Generates Argentine-compliant invoice PDFs using PDFKit.
 * Returns a Buffer that can be saved or sent via WhatsApp.
 */

import PDFDocument from "pdfkit";

export interface InvoicePdfData {
  // Seller
  sellerName: string;
  sellerCuit: string;
  sellerAddress?: string;
  sellerIvaCondition: string;
  // Buyer
  buyerName: string;
  buyerCuit?: string;
  buyerDni?: string;
  buyerIvaCondition: string;
  buyerAddress?: string;
  // Invoice
  invoiceType: "A" | "B" | "C";
  pointOfSale: number;
  invoiceNumber: number;
  date: Date;
  cae: string;
  caeExpiry: Date;
  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
}

/**
 * Generate an invoice PDF and return it as a Buffer.
 */
export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // margins

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(`FACTURA ${data.invoiceType}`, { align: "center" });
      doc.moveDown(0.5);

      // Invoice number
      const pvStr = String(data.pointOfSale).padStart(5, "0");
      const numStr = String(data.invoiceNumber).padStart(8, "0");
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Nro: ${pvStr}-${numStr}`, { align: "center" });
      doc
        .fontSize(10)
        .text(`Fecha: ${formatDate(data.date)}`, { align: "center" });
      doc.moveDown(1);

      // Divider
      drawLine(doc, 50, doc.y, 50 + pageWidth, doc.y);
      doc.moveDown(0.5);

      // Seller info
      doc.fontSize(10).font("Helvetica-Bold").text("EMISOR:");
      doc
        .font("Helvetica")
        .text(`Razón Social: ${data.sellerName}`)
        .text(`CUIT: ${formatCuit(data.sellerCuit)}`)
        .text(`Condición IVA: ${data.sellerIvaCondition}`);
      if (data.sellerAddress) {
        doc.text(`Domicilio: ${data.sellerAddress}`);
      }
      doc.moveDown(0.5);

      // Buyer info
      doc.font("Helvetica-Bold").text("RECEPTOR:");
      doc.font("Helvetica").text(`Nombre: ${data.buyerName}`);
      if (data.buyerCuit) {
        doc.text(`CUIT: ${formatCuit(data.buyerCuit)}`);
      } else if (data.buyerDni) {
        doc.text(`DNI: ${data.buyerDni}`);
      }
      doc.text(`Condición IVA: ${data.buyerIvaCondition}`);
      if (data.buyerAddress) {
        doc.text(`Domicilio: ${data.buyerAddress}`);
      }
      doc.moveDown(1);

      // Items table header
      drawLine(doc, 50, doc.y, 50 + pageWidth, doc.y);
      doc.moveDown(0.3);
      const colX = [50, 280, 370, 460];
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Descripción", colX[0], doc.y, { width: 220 });
      const headerY = doc.y - 11;
      doc.text("Cantidad", colX[1], headerY, { width: 80, align: "right" });
      doc.text("P. Unit.", colX[2], headerY, { width: 80, align: "right" });
      doc.text("Total", colX[3], headerY, { width: 80, align: "right" });
      doc.moveDown(0.5);
      drawLine(doc, 50, doc.y, 50 + pageWidth, doc.y);
      doc.moveDown(0.3);

      // Items
      doc.font("Helvetica").fontSize(9);
      for (const item of data.items) {
        doc.text(item.description, colX[0], doc.y, { width: 220 });
        const rowY = doc.y - 11;
        doc.text(String(item.quantity), colX[1], rowY, {
          width: 80,
          align: "right",
        });
        doc.text(`$${item.unitPrice.toFixed(2)}`, colX[2], rowY, {
          width: 80,
          align: "right",
        });
        doc.text(`$${item.total.toFixed(2)}`, colX[3], rowY, {
          width: 80,
          align: "right",
        });
        doc.moveDown(0.3);
      }

      // Total
      doc.moveDown(0.5);
      drawLine(doc, 50, doc.y, 50 + pageWidth, doc.y);
      doc.moveDown(0.5);

      if (data.invoiceType === "A") {
        const net = data.totalAmount / 1.21;
        const iva = data.totalAmount - net;
        doc.font("Helvetica").fontSize(10);
        doc.text(`Neto Gravado: $${net.toFixed(2)}`, { align: "right" });
        doc.text(`IVA 21%: $${iva.toFixed(2)}`, { align: "right" });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`TOTAL: $${data.totalAmount.toFixed(2)}`, { align: "right" });

      doc.moveDown(1);

      // CAE
      drawLine(doc, 50, doc.y, 50 + pageWidth, doc.y);
      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(`CAE: ${data.cae}`, { align: "left" })
        .text(`Vencimiento CAE: ${formatDate(data.caeExpiry)}`, {
          align: "left",
        });

      doc.moveDown(1);
      doc
        .fontSize(8)
        .fillColor("#666")
        .text("Documento generado electrónicamente por VendéBot", {
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawLine(
  doc: PDFKit.PDFDocument,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor("#ccc").stroke();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, "");
  if (clean.length === 11) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return cuit;
}
