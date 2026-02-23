import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { products, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateSmartPrice, type UnitType } from "@/lib/catalog/price-calculator";

async function getTenantId(clerkUserId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, clerkUserId))
    .limit(1);
  return tenant?.id ?? null;
}

// POST /api/catalog/calculate — smart price calculation
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { productId, quantity, widthM, heightM, grams } = body;

  if (!productId || quantity === undefined) {
    return NextResponse.json({ error: "productId and quantity are required" }, { status: 400 });
  }

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const result = calculateSmartPrice({
    unitPrice: parseFloat(product.price),
    unit: product.unit as UnitType,
    quantity,
    wastePercentage: parseFloat(product.wastePercentage ?? "0"),
    widthM,
    heightM,
    grams,
  });

  return NextResponse.json({
    product: { id: product.id, name: product.name },
    calculation: result,
  });
}
