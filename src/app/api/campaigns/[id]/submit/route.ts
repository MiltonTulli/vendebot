import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { campaigns, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { submitTemplate, populateCampaignRecipients } from "@/lib/whatsapp/broadcast";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenant.id)));

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // Submit template to Meta for approval
    const result = await submitTemplate({
      name: campaign.templateName,
      language: campaign.templateLanguage,
      category: campaign.templateCategory as "MARKETING" | "UTILITY",
      body: campaign.templateBody,
      params: campaign.templateParams ?? undefined,
    });

    // Populate recipients
    const recipientCount = await populateCampaignRecipients(
      campaign.id,
      tenant.id,
      campaign.recipientFilter ?? undefined
    );

    await db
      .update(campaigns)
      .set({
        status: "pending_approval",
        metaTemplateId: result.id,
        totalRecipients: recipientCount,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));

    return NextResponse.json({ status: "pending_approval", metaTemplateId: result.id, recipientCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
