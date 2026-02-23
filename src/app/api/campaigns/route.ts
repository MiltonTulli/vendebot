import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { campaigns, tenants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  submitTemplate,
  populateCampaignRecipients,
} from "@/lib/whatsapp/broadcast";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const list = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.tenantId, tenant.id))
    .orderBy(desc(campaigns.createdAt));

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const { name, templateName, templateBody, templateCategory, templateParams, recipientFilter } =
    body;

  // Create campaign
  const [campaign] = await db
    .insert(campaigns)
    .values({
      tenantId: tenant.id,
      name,
      templateName,
      templateBody,
      templateCategory: templateCategory || "MARKETING",
      templateParams: templateParams || [],
      recipientFilter: recipientFilter || { all: true },
      status: "draft",
    })
    .returning();

  return NextResponse.json(campaign);
}
