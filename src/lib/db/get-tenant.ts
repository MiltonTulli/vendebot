import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current user's tenant ID from Clerk auth.
 * Returns null if not authenticated or tenant not found.
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId))
    .limit(1);

  return tenant?.id ?? null;
}
