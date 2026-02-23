/**
 * External Database Connector
 * Read-only access to PostgreSQL or MySQL databases for product/inventory sync
 */

import { neon } from "@neondatabase/serverless";

export interface ExternalDbConfig {
  type: "postgresql" | "mysql";
  connectionUrl: string;
  query: string; // SQL query to fetch products
  mapping: {
    name: string;
    description?: string;
    price: string;
    stock?: string;
    category?: string;
    sku?: string;
  };
}

export interface ExternalProduct {
  name: string;
  description: string;
  price: string;
  inStock: boolean;
  category: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Query an external PostgreSQL database (read-only)
 * Uses @neondatabase/serverless which works with any PostgreSQL
 */
async function queryPostgres(
  connectionUrl: string,
  query: string
): Promise<Record<string, unknown>[]> {
  const sql = neon(connectionUrl);
  // Cast to allow dynamic query string (read-only use)
  const execQuery = sql as unknown as (q: string) => Promise<Record<string, unknown>[]>;
  const rows = await execQuery(query);
  return rows;
}

/**
 * Query an external MySQL database via a generic fetch-based approach
 * For MySQL, we use PlanetScale-compatible HTTP endpoint or similar
 * In production, use a serverless MySQL driver
 */
async function queryMysql(
  connectionUrl: string,
  query: string
): Promise<Record<string, unknown>[]> {
  // For MySQL, we'd typically use @planetscale/database or mysql2
  // Since we can't add arbitrary deps, we'll support PostgreSQL natively
  // and provide a clear error for MySQL
  throw new Error(
    "MySQL support requires the mysql2 package. " +
      "Install it with: bun add mysql2, then update this connector. " +
      "PostgreSQL is supported out of the box."
  );
}

/**
 * Fetch products from an external database
 */
export async function fetchExternalProducts(
  config: ExternalDbConfig
): Promise<ExternalProduct[]> {
  let rows: Record<string, unknown>[];

  if (config.type === "postgresql") {
    rows = await queryPostgres(config.connectionUrl, config.query);
  } else if (config.type === "mysql") {
    rows = await queryMysql(config.connectionUrl, config.query);
  } else {
    throw new Error(`Unsupported database type: ${config.type}`);
  }

  return rows.map((row) => ({
    name: String(row[config.mapping.name] ?? ""),
    description: config.mapping.description
      ? String(row[config.mapping.description] ?? "")
      : "",
    price: String(row[config.mapping.price] ?? "0"),
    inStock: config.mapping.stock
      ? Number(row[config.mapping.stock] ?? 0) > 0
      : true,
    category: config.mapping.category
      ? String(row[config.mapping.category] ?? "")
      : null,
    metadata: {
      source: "external_db",
      sku: config.mapping.sku ? String(row[config.mapping.sku] ?? "") : undefined,
      rawRow: row,
    },
  }));
}

/**
 * Test an external database connection
 */
export async function testExternalDbConnection(
  type: "postgresql" | "mysql",
  connectionUrl: string
): Promise<{ success: boolean; error?: string; rowCount?: number }> {
  try {
    if (type === "postgresql") {
      const sql = neon(connectionUrl);
      const result = await sql`SELECT 1 as test`;
      return { success: true, rowCount: result.length };
    } else {
      return { success: false, error: "MySQL not yet supported" };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
