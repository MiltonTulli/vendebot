import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { products, tenants } from "@/lib/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";

async function getTenantId(clerkUserId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, clerkUserId))
    .limit(1);
  return tenant?.id ?? null;
}

// GET /api/products — list products with optional search
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const category = url.searchParams.get("category");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  const conditions = [eq(products.tenantId, tenantId)];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(products.name, pattern), ilike(products.description, pattern))!
    );
  }
  if (category) {
    conditions.push(eq(products.category, category));
  }

  const results = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ products: results, page, limit });
}

// POST /api/products — create product
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { name, description, price, unit, wastePercentage, category, imageUrl, inStock, metadata } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const [product] = await db
    .insert(products)
    .values({
      tenantId,
      name,
      description: description ?? null,
      price: String(price),
      unit: unit ?? "unidad",
      wastePercentage: wastePercentage !== undefined ? String(wastePercentage) : "0",
      category: category ?? null,
      imageUrl: imageUrl ?? null,
      inStock: inStock ?? true,
      metadata: metadata ?? null,
    })
    .returning();

  return NextResponse.json({ product }, { status: 201 });
}
