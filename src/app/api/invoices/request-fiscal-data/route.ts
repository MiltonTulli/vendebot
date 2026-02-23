/**
 * POST /api/invoices/request-fiscal-data
 *
 * Send a WhatsApp message to a customer requesting their fiscal data
 * (CUIT/DNI, razón social, condición IVA) for invoicing.
 *
 * Body: { customerId: string, orderId?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getWhatsAppProvider } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { customerId } = await request.json();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const wa = getWhatsAppProvider();

    // Send interactive message requesting fiscal data
    await wa.sendInteractiveButtons({
      type: "interactive_buttons",
      to: customer.whatsappNumber,
      body:
        `🧾 Hola${customer.name ? ` ${customer.name}` : ""}! Para emitir tu factura, necesitamos tus datos fiscales.\n\n` +
        `Por favor respondé con:\n` +
        `• Tu CUIT o DNI\n` +
        `• Razón social o nombre completo\n` +
        `• Condición ante IVA\n\n` +
        `Ejemplo: "CUIT 20-12345678-9, Juan Pérez, Monotributista"\n\n` +
        `O elegí una opción:`,
      buttons: [
        { id: "fiscal_cf", title: "Consumidor Final" },
        { id: "fiscal_ri", title: "Resp. Inscripto" },
        { id: "fiscal_mono", title: "Monotributista" },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud de datos fiscales enviada por WhatsApp",
    });
  } catch (error) {
    console.error("Request fiscal data error:", error);
    return NextResponse.json(
      { error: "Error al solicitar datos fiscales" },
      { status: 500 }
    );
  }
}
