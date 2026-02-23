import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { seoPages, tenants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const pages = await db
    .select()
    .from(seoPages)
    .where(eq(seoPages.tenantId, tenant.id))
    .orderBy(desc(seoPages.createdAt));

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkUserId, userId));
  if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const { slug, title, description, heroImage, showCatalog, showWhatsappButton, published } = body;

  const [page] = await db
    .insert(seoPages)
    .values({
      tenantId: tenant.id,
      slug,
      title,
      description,
      heroImage,
      showCatalog: showCatalog ?? true,
      showWhatsappButton: showWhatsappButton ?? true,
      published: published ?? false,
    })
    .returning();

  return NextResponse.json(page);
}
