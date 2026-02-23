import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { products, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseAndMapCSV } from "@/lib/catalog/csv-parser";

async function getTenantId(clerkUserId: string): Promise<string | null> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.clerkUserId, clerkUserId))
    .limit(1);
  return tenant?.id ?? null;
}

// POST /api/catalog/import — upload CSV text and AI-parse into products
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(userId);
  if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";

  let csvText: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Support .csv and .txt; for Excel (.xlsx) we'd need a library — 
    // for now we handle CSV/TSV
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".tsv") && !fileName.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a CSV or TSV file." },
        { status: 400 }
      );
    }

    csvText = await file.text();
  } else {
    // JSON body with csvText field
    const body = await request.json();
    csvText = body.csvText;
  }

  if (!csvText || csvText.trim().length === 0) {
    return NextResponse.json({ error: "Empty CSV data" }, { status: 400 });
  }

  try {
    const { products: parsed, mapping, totalRows, skippedRows } = await parseAndMapCSV(csvText);

    if (parsed.length === 0) {
      return NextResponse.json({
        error: "No valid products found in the file",
        mapping,
        totalRows,
        skippedRows,
      }, { status: 400 });
    }

    // Check if dryRun
    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun") === "true";

    if (dryRun) {
      return NextResponse.json({
        preview: true,
        products: parsed,
        mapping,
        totalRows,
        skippedRows,
      });
    }

    // Insert products
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
      products: inserted,
    }, { status: 201 });
  } catch (error) {
    console.error("Catalog import error:", error);
    return NextResponse.json(
      { error: "Failed to parse and import catalog" },
      { status: 500 }
    );
  }
}
