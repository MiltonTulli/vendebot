import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchExternalProducts } from "@/lib/integrations/external-db";
import type { ExternalDbConfig } from "@/lib/integrations/external-db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .then((r) => r[0]);

  if (!tenant?.externalDbUrl || !tenant?.externalDbType) {
    return NextResponse.json(
      { error: "External DB not configured" },
      { status: 400 }
    );
  }

  const body = await req.json() as { query: string; mapping: ExternalDbConfig["mapping"] };

  const config: ExternalDbConfig = {
    type: tenant.externalDbType as "postgresql" | "mysql",
    connectionUrl: tenant.externalDbUrl,
    query: body.query,
    mapping: body.mapping,
  };

  try {
    const externalProducts = await fetchExternalProducts(config);
    let synced = 0;

    for (const ext of externalProducts) {
      await db.insert(products).values({
        tenantId: tenant.id,
        name: ext.name,
        description: ext.description,
        price: ext.price,
        inStock: ext.inStock,
        category: ext.category,
        unit: "unidad",
        metadata: ext.metadata,
      });
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
