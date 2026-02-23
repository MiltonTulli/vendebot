import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";
import { CatalogClient } from "./catalog-client";

export default async function CatalogPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return <div className="py-12 text-center text-muted-foreground">Configurá tu cuenta primero.</div>;
  }

  const rows = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenantId))
    .orderBy(desc(products.createdAt))
    .limit(200);

  const serialized = rows.map((p) => ({
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    unit: p.unit,
    category: p.category ?? "",
    inStock: p.inStock,
    waste: parseFloat(p.wastePercentage ?? "0"),
    description: p.description ?? "",
  }));

  return <CatalogClient products={serialized} />;
}
