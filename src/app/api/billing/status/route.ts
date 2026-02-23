import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenant.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return NextResponse.json({ subscription: sub || null });
}
