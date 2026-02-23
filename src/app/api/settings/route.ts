import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";

export async function GET() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    businessName: tenant.businessName,
    whatsappNumber: tenant.whatsappNumber ?? "",
    ownerPhoneNumber: tenant.ownerPhoneNumber ?? "",
    botPersonality: tenant.botPersonality ?? "",
    businessInfo: tenant.businessInfo ?? {},
    mercadopagoConnected: !!tenant.mercadopagoAccessToken,
    mercadopagoUserId: tenant.mercadopagoUserId ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.businessName !== undefined) updateData.businessName = body.businessName;
  if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber;
  if (body.ownerPhoneNumber !== undefined) updateData.ownerPhoneNumber = body.ownerPhoneNumber;
  if (body.botPersonality !== undefined) updateData.botPersonality = body.botPersonality;
  if (body.businessInfo !== undefined) updateData.businessInfo = body.businessInfo;

  await db.update(tenants).set(updateData).where(eq(tenants.id, tenantId));

  return NextResponse.json({ success: true });
}
