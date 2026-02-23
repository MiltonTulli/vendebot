import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { products, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getTenantId(clerkUserId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, clerkUserId))
    .limit(1);
  return tenant?.id ?? null;
}

// GET /api/products/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ product });
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { id } = await params;
  const body = await request.json();

  // Build update object from provided fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = String(body.price);
  if (body.unit !== undefined) updateData.unit = body.unit;
  if (body.wastePercentage !== undefined) updateData.wastePercentage = String(body.wastePercentage);
  if (body.category !== undefined) updateData.category = body.category;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.inStock !== undefined) updateData.inStock = body.inStock;
  if (body.metadata !== undefined) updateData.metadata = body.metadata;

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ product: updated });
}

// DELETE /api/products/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { id } = await params;

  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning({ id: products.id });

  if (!deleted) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ deleted: true, id: deleted.id });
}
