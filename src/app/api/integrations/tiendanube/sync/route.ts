import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TiendanubeClient, mapTiendanubeProduct } from "@/lib/integrations/tiendanube";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .then((r) => r[0]);

  if (!tenant?.tiendanubeStoreId || !tenant?.tiendanubeAccessToken) {
    return NextResponse.json(
      { error: "Tiendanube not configured" },
      { status: 400 }
    );
  }

  const client = new TiendanubeClient(
    tenant.tiendanubeStoreId,
    tenant.tiendanubeAccessToken
  );

  try {
    const tnProducts = await client.getAllProducts();
    let synced = 0;

    for (const tnProduct of tnProducts) {
      const mapped = mapTiendanubeProduct(tnProduct);
      // Upsert: check if product with this tiendanube ID exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant.id))
        .then((rows) =>
          rows.find(
            (r) =>
              (r.metadata as Record<string, unknown>)?.tiendanubeProductId ===
              tnProduct.id
          )
        );

      if (existing) {
        await db
          .update(products)
          .set({
            name: mapped.name,
            description: mapped.description,
            price: mapped.price,
            inStock: mapped.inStock,
            imageUrl: mapped.imageUrl,
            category: mapped.category,
            metadata: mapped.metadata,
            updatedAt: new Date(),
          })
          .where(eq(products.id, existing.id));
      } else {
        await db.insert(products).values({
          tenantId: tenant.id,
          name: mapped.name,
          description: mapped.description,
          price: mapped.price,
          inStock: mapped.inStock,
          imageUrl: mapped.imageUrl,
          category: mapped.category,
          unit: "unidad",
          metadata: mapped.metadata,
        });
      }
      synced++;
    }

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
