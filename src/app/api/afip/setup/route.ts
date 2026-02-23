/**
 * POST /api/afip/setup
 *
 * Save AFIP certificate and key for a tenant.
 * Also validates the credentials by testing a connection.
 *
 * Body: { cert: string, key: string, cuit: string, ivaCondition: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createAfipClient } from "@/lib/afip";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { cert, key, cuit, ivaCondition } = await request.json();

    if (!cert || !key || !cuit) {
      return NextResponse.json(
        { error: "Certificado, clave privada y CUIT son requeridos" },
        { status: 400 }
      );
    }

    // Validate CUIT format (11 digits)
    const cleanCuit = cuit.replace(/\D/g, "");
    if (cleanCuit.length !== 11) {
      return NextResponse.json(
        { error: "CUIT debe tener 11 dígitos" },
        { status: 400 }
      );
    }

    // Test AFIP connection
    try {
      const afip = createAfipClient({
        cuit: cleanCuit,
        cert,
        key,
        production: process.env.AFIP_PRODUCTION === "true",
      });

      // Try to get server status as a health check
      await afip.ElectronicBilling.getServerStatus();
    } catch (afipError) {
      console.error("AFIP validation error:", afipError);
      return NextResponse.json(
        {
          error:
            "No se pudo conectar con AFIP. Verifique que el certificado y la clave sean correctos.",
          details: afipError instanceof Error ? afipError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Get current tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // Update tenant with AFIP credentials
    const currentBusinessInfo = tenant.businessInfo || {};

    await db
      .update(tenants)
      .set({
        afipCert: cert,
        afipKey: key,
        afipCuit: cleanCuit,
        businessInfo: {
          ...currentBusinessInfo,
          ivaCondition: ivaCondition || "monotributista",
        },
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({
      success: true,
      message: "AFIP configurado correctamente. Conexión verificada.",
    });
  } catch (error) {
    console.error("AFIP setup error:", error);
    return NextResponse.json(
      { error: "Error al configurar AFIP" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/afip/setup
 *
 * Check if AFIP is configured for the current tenant.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkUserId, userId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const businessInfo = tenant.businessInfo as Record<string, unknown> | null;

    return NextResponse.json({
      configured: !!(tenant.afipCert && tenant.afipKey && tenant.afipCuit),
      cuit: tenant.afipCuit
        ? `${tenant.afipCuit.slice(0, 2)}-XXXXXXXX-${tenant.afipCuit.slice(10)}`
        : null,
      ivaCondition: businessInfo?.ivaCondition || null,
      production: process.env.AFIP_PRODUCTION === "true",
    });
  } catch (error) {
    console.error("AFIP setup check error:", error);
    return NextResponse.json(
      { error: "Error al verificar AFIP" },
      { status: 500 }
    );
  }
}
