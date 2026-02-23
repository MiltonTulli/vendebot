import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, integrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";

export async function GET() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [tenant] = await db
    .select({
      tiendanubeStoreId: tenants.tiendanubeStoreId,
      tiendanubeAccessToken: tenants.tiendanubeAccessToken,
      mercadolibreUserId: tenants.mercadolibreUserId,
      mercadolibreAccessToken: tenants.mercadolibreAccessToken,
      externalDbUrl: tenants.externalDbUrl,
      externalDbType: tenants.externalDbType,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const intRows = await db
    .select({
      provider: integrations.provider,
      enabled: integrations.enabled,
      lastSyncAt: integrations.lastSyncAt,
      config: integrations.config,
    })
    .from(integrations)
    .where(eq(integrations.tenantId, tenantId));

  const intMap = new Map(intRows.map((i) => [i.provider, i]));

  return NextResponse.json({
    tiendanube: {
      connected: !!tenant?.tiendanubeAccessToken,
      storeId: tenant?.tiendanubeStoreId ?? "",
      lastSync: intMap.get("tiendanube")?.lastSyncAt?.toISOString() ?? null,
    },
    mercadolibre: {
      connected: !!tenant?.mercadolibreAccessToken,
      userId: tenant?.mercadolibreUserId ?? "",
      lastSync: intMap.get("mercadolibre")?.lastSyncAt?.toISOString() ?? null,
    },
    externalDb: {
      connected: !!tenant?.externalDbUrl,
      type: tenant?.externalDbType ?? "",
      lastSync: intMap.get("external_db")?.lastSyncAt?.toISOString() ?? null,
      config: intMap.get("external_db")?.config ?? null,
    },
  });
}
