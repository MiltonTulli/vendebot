/**
 * CSV/Excel parser with AI-powered column mapping.
 * Parses raw CSV text and uses OpenAI to map columns to product fields.
 */

import OpenAI from "openai";

export interface ParsedProduct {
  name: string;
  description?: string;
  price: number;
  unit: string;
  wastePercentage?: number;
  category?: string;
  inStock?: boolean;
}

/**
 * Parse CSV text into rows (handles quoted fields, semicolons, tabs).
 */
export function parseCSVText(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  const delimiter = detectDelimiter(lines[0] ?? "");

  return lines.map((line) => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

function detectDelimiter(headerLine: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of headerLine) {
    if (ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",";
}

/**
 * Use AI to map CSV columns to product fields.
 */
export async function aiMapColumns(
  headers: string[],
  sampleRows: string[][]
): Promise<Record<string, number>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a data mapping assistant. Given CSV headers and sample data, map them to these product fields:
- name (required): product name
- description: product description  
- price (required): price per unit (numeric)
- unit: one of: unidad, kg, m2, m_lineal, litro, docena, combo
- wastePercentage: waste/scrap percentage
- category: product category
- inStock: availability (true/false)

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows.slice(0, 3))}

Return a JSON object mapping field names to column indices (0-based). Only include fields you can confidently map. Example: {"name": 0, "price": 2, "category": 1}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as Record<string, number>;
}

/**
 * Full pipeline: parse CSV text → AI map → structured products.
 */
export async function parseAndMapCSV(csvText: string): Promise<{
  products: ParsedProduct[];
  mapping: Record<string, number>;
  totalRows: number;
  skippedRows: number;
}> {
  const rows = parseCSVText(csvText);
  if (rows.length < 2) {
    return { products: [], mapping: {}, totalRows: 0, skippedRows: 0 };
  }

  const headers = rows[0]!;
  const dataRows = rows.slice(1);
  const mapping = await aiMapColumns(headers, dataRows);

  const products: ParsedProduct[] = [];
  let skippedRows = 0;

  for (const row of dataRows) {
    try {
      const name = mapping.name !== undefined ? row[mapping.name] : undefined;
      const priceStr = mapping.price !== undefined ? row[mapping.price] : undefined;

      if (!name || !priceStr) {
        skippedRows++;
        continue;
      }

      // Clean price: remove $, dots as thousands sep, replace comma with dot
      const cleanPrice = priceStr
        .replace(/[$ ]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const price = parseFloat(cleanPrice);

      if (isNaN(price)) {
        skippedRows++;
        continue;
      }

      const product: ParsedProduct = { name: name.trim(), price, unit: "unidad" };

      if (mapping.description !== undefined) {
        product.description = row[mapping.description]?.trim();
      }
      if (mapping.unit !== undefined) {
        const rawUnit = row[mapping.unit]?.trim().toLowerCase() ?? "unidad";
        product.unit = normalizeUnit(rawUnit);
      } else {
        product.unit = "unidad";
      }
      if (mapping.wastePercentage !== undefined) {
        const wp = parseFloat(row[mapping.wastePercentage] ?? "0");
        if (!isNaN(wp)) product.wastePercentage = wp;
      }
      if (mapping.category !== undefined) {
        product.category = row[mapping.category]?.trim();
      }
      if (mapping.inStock !== undefined) {
        const val = row[mapping.inStock]?.trim().toLowerCase();
        product.inStock = !["no", "false", "0", "agotado", "sin stock"].includes(val ?? "");
      }

      products.push(product);
    } catch {
      skippedRows++;
    }
  }

  return { products, mapping, totalRows: dataRows.length, skippedRows };
}

function normalizeUnit(raw: string): string {
  const map: Record<string, string> = {
    unidad: "unidad", u: "unidad", un: "unidad", unidades: "unidad",
    kg: "kg", kilo: "kg", kilos: "kg", kilogramo: "kg", kilogramos: "kg",
    m2: "m2", "m²": "m2", "metro cuadrado": "m2", "metros cuadrados": "m2",
    "m lineal": "m_lineal", ml: "m_lineal", "metro lineal": "m_lineal", "metros lineales": "m_lineal", m_lineal: "m_lineal",
    litro: "litro", l: "litro", litros: "litro", lt: "litro",
    docena: "docena", doc: "docena", docenas: "docena",
    combo: "combo", combos: "combo",
  };
  return map[raw] ?? "unidad";
}
