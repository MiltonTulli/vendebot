import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { products, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseAndMapCSV } from "@/lib/catalog/csv-parser";

async function getTenantId(clerkUserId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, clerkUserId))
    .limit(1);
  return tenant?.id ?? null;
}

// GET /api/catalog/sheets/callback — OAuth callback (Phase 3 stub for Google OAuth flow)
// POST /api/catalog/sheets — sync from a Google Sheets URL (public or shared)
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const body = await request.json();
  const { spreadsheetUrl, sheetName, mode } = body as {
    spreadsheetUrl: string;
    sheetName?: string;
    mode?: "replace" | "merge";
  };

  if (!spreadsheetUrl) {
    return NextResponse.json({ error: "spreadsheetUrl is required" }, { status: 400 });
  }

  // Extract spreadsheet ID from URL
  const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 });
  }

  const spreadsheetId = match[1];
  const sheet = sheetName ?? "Sheet1";

  // Use Google Sheets public CSV export
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch spreadsheet. Make sure it's shared as 'Anyone with the link'." },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    const { products: parsed, mapping, totalRows, skippedRows } = await parseAndMapCSV(csvText);

    if (parsed.length === 0) {
      return NextResponse.json({
        error: "No valid products found in the spreadsheet",
        mapping,
        totalRows,
        skippedRows,
      }, { status: 400 });
    }

    // If mode is "replace", delete existing products first
    if (mode === "replace") {
      await db.delete(products).where(eq(products.tenantId, tenantId));
    }

    const inserted = await db
      .insert(products)
      .values(
        parsed.map((p) => ({
          tenantId,
          name: p.name,
          description: p.description ?? null,
          price: String(p.price),
          unit: p.unit as "unidad" | "kg" | "m2" | "m_lineal" | "litro" | "docena" | "combo",
          wastePercentage: p.wastePercentage !== undefined ? String(p.wastePercentage) : "0",
          category: p.category ?? null,
          inStock: p.inStock ?? true,
        }))
      )
      .returning({ id: products.id, name: products.name });

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      totalRows,
      skippedRows,
      mapping,
      mode: mode ?? "merge",
      source: `Google Sheets: ${spreadsheetId}/${sheet}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Google Sheets sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync from Google Sheets" },
      { status: 500 }
    );
  }
}
