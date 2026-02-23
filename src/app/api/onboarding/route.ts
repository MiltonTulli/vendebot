import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { businessName, whatsappNumber, botPersonality, address, hours, description, deliveryZones } = body;

  if (!businessName) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  const businessInfo = {
    address: address || undefined,
    hours: hours || undefined,
    description: description || undefined,
    deliveryZones: deliveryZones
      ? deliveryZones.split(",").map((z: string) => z.trim()).filter(Boolean)
      : undefined,
  };

  // Check if tenant exists
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .limit(1);

  if (existing) {
    // Update
    await db
      .update(tenants)
      .set({
        businessName,
        whatsappNumber: whatsappNumber || null,
        botPersonality: botPersonality || null,
        businessInfo,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, existing.id));

    return NextResponse.json({ success: true, tenantId: existing.id });
  } else {
    // Create
    const [created] = await db
      .insert(tenants)
      .values({
        clerkUserId: userId,
        businessName,
        whatsappNumber: whatsappNumber || null,
        botPersonality: botPersonality || null,
        businessInfo,
      })
      .returning({ id: tenants.id });

    return NextResponse.json({ success: true, tenantId: created.id });
  }
}
