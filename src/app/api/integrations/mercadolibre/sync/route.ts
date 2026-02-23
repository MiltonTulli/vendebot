import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MercadoLibreClient, mapMeliItem } from "@/lib/integrations/mercadolibre";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .then((r) => r[0]);

  if (!tenant?.mercadolibreAccessToken || !tenant?.mercadolibreUserId) {
    return NextResponse.json(
      { error: "MercadoLibre not configured" },
      { status: 400 }
    );
  }

  const client = new MercadoLibreClient(
    tenant.mercadolibreAccessToken,
    tenant.mercadolibreRefreshToken ?? undefined
  );

  try {
    const items = await client.getAllItems(tenant.mercadolibreUserId);
    let synced = 0;

    for (const item of items) {
      const mapped = mapMeliItem(item);
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant.id))
        .then((rows) =>
          rows.find(
            (r) =>
              (r.metadata as Record<string, unknown>)?.mercadolibreItemId ===
              item.id
          )
        );

      if (existing) {
        await db
          .update(products)
          .set({
            name: mapped.name,
            price: mapped.price,
            inStock: mapped.inStock,
            imageUrl: mapped.imageUrl,
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
