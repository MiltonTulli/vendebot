import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSubscription } from "@/lib/billing/mercadopago";
import type { Plan } from "@/lib/billing/plans";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const { planId } = (await req.json()) as { planId: Plan["id"] };

  try {
    const result = await createSubscription({
      planId,
      payerEmail: email,
      tenantId: tenant.id,
    });

    // Store subscription record
    await db.insert(subscriptions).values({
      tenantId: tenant.id,
      plan: planId,
      status: "pending",
      mpPreapprovalId: result.id,
      priceArs: planId === "starter" ? 15000 : planId === "pro" ? 35000 : 75000,
    });

    return NextResponse.json({ initPoint: result.init_point, preapprovalId: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
