import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { campaigns, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkTemplateStatus } from "@/lib/whatsapp/broadcast";

export async function GET(
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

  if (campaign.status === "pending_approval") {
    const templateStatus = await checkTemplateStatus(campaign.templateName);
    if (templateStatus) {
      const newStatus =
        templateStatus.status === "APPROVED"
          ? "approved"
          : templateStatus.status === "REJECTED"
            ? "rejected"
            : "pending_approval";

      if (newStatus !== "pending_approval") {
        await db
          .update(campaigns)
          .set({
            status: newStatus as "approved" | "rejected",
            rejectionReason:
              newStatus === "rejected" ? templateStatus.rejected_reason : null,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, id));
      }

      return NextResponse.json({ ...campaign, status: newStatus });
    }
  }

  return NextResponse.json(campaign);
}
