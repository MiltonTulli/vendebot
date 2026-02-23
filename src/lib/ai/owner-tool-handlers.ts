/**
 * Owner management tool handler implementations.
 */

import { db } from "@/lib/db";
import {
  products,
  tenants,
  orders,
  customers,
  messages,
  conversations,
  changeLogs,
} from "@/lib/db/schema";
import { eq, and, ilike, or, gte, sql } from "drizzle-orm";
import { getWhatsAppProvider } from "@/lib/whatsapp";

interface OwnerToolContext {
  tenantId: string;
}

export async function handleOwnerToolCall(
  name: string,
  args: Record<string, unknown>,
  ctx: OwnerToolContext
): Promise<unknown> {
  switch (name) {
    case "owner_search_products":
      return ownerSearchProducts(args.query as string, ctx.tenantId);
    case "owner_update_price":
      return ownerUpdatePrice(
        args.product_id as string,
        args.new_price as number,
        ctx.tenantId
      );
    case "owner_update_hours":
      return ownerUpdateHours(args.new_hours as string, ctx.tenantId);
    case "owner_add_product":
      return ownerAddProduct(
        {
          name: args.name as string,
          price: args.price as number,
          unit: (args.unit as string) ?? "unidad",
          category: args.category as string | undefined,
          description: args.description as string | undefined,
        },
        ctx.tenantId
      );
    case "owner_remove_product":
      return ownerRemoveProduct(args.product_id as string, ctx.tenantId);
    case "owner_check_sales":
      return ownerCheckSales(
        (args.period as string) ?? "today",
        ctx.tenantId
      );
    case "owner_broadcast":
      return ownerBroadcast(
        args.message as string,
        args.product_query as string | undefined,
        ctx.tenantId
      );
    default:
      return { error: `Unknown owner tool: ${name}` };
  }
}

async function ownerSearchProducts(query: string, tenantId: string) {
  const pattern = `%${query}%`;
  const results = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      unit: products.unit,
      category: products.category,
      inStock: products.inStock,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenantId),
        or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
          ilike(products.category, pattern)
        )
      )
    )
    .limit(10);

  if (results.length === 0) {
    return { message: "No se encontraron productos.", results: [] };
  }

  return {
    message: `${results.length} producto(s) encontrado(s).`,
    results: results.map((p) => ({
      id: p.id,
      name: p.name,
      price: `$${p.price}`,
      unit: p.unit,
      category: p.category,
      inStock: p.inStock,
    })),
  };
}

async function ownerUpdatePrice(
  productId: string,
  newPrice: number,
  tenantId: string
) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return { error: "Producto no encontrado." };
  }

  const oldPrice = product.price;

  await db
    .update(products)
    .set({ price: newPrice.toFixed(2), updatedAt: new Date() })
    .where(eq(products.id, productId));

  await db.insert(changeLogs).values({
    tenantId,
    action: "update_price",
    description: `Precio de "${product.name}" actualizado: $${oldPrice} → $${newPrice.toFixed(2)}/${product.unit}`,
    details: {
      productId,
      productName: product.name,
      oldPrice,
      newPrice: newPrice.toFixed(2),
      unit: product.unit,
    },
    source: "whatsapp",
  });

  return {
    success: true,
    product: product.name,
    oldPrice: `$${oldPrice}`,
    newPrice: `$${newPrice.toFixed(2)}`,
    unit: product.unit,
  };
}

async function ownerUpdateHours(newHours: string, tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { error: "Negocio no encontrado." };
  }

  const oldHours = tenant.businessInfo?.hours ?? "No especificado";
  const updatedInfo = { ...tenant.businessInfo, hours: newHours };

  await db
    .update(tenants)
    .set({ businessInfo: updatedInfo, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  await db.insert(changeLogs).values({
    tenantId,
    action: "update_hours" as const,
    description: `Horario actualizado: "${oldHours}" → "${newHours}"`,
    details: { oldHours, newHours },
    source: "whatsapp",
  });

  return {
    success: true,
    oldHours,
    newHours,
  };
}

async function ownerAddProduct(
  data: {
    name: string;
    price: number;
    unit: string;
    category?: string;
    description?: string;
  },
  tenantId: string
) {
  const [product] = await db
    .insert(products)
    .values({
      tenantId,
      name: data.name,
      price: data.price.toFixed(2),
      unit: data.unit as "unidad" | "kg" | "m2" | "m_lineal" | "litro" | "docena" | "combo",
      category: data.category,
      description: data.description,
      inStock: true,
    })
    .returning();

  await db.insert(changeLogs).values({
    tenantId,
    action: "add_product",
    description: `Producto agregado: "${data.name}" a $${data.price.toFixed(2)}/${data.unit}`,
    details: {
      productId: product.id,
      name: data.name,
      price: data.price.toFixed(2),
      unit: data.unit,
      category: data.category,
    },
    source: "whatsapp",
  });

  return {
    success: true,
    productId: product.id,
    name: data.name,
    price: `$${data.price.toFixed(2)}`,
    unit: data.unit,
  };
}

async function ownerRemoveProduct(productId: string, tenantId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return { error: "Producto no encontrado." };
  }

  await db
    .update(products)
    .set({ inStock: false, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await db.insert(changeLogs).values({
    tenantId,
    action: "remove_product",
    description: `Producto removido del menú: "${product.name}"`,
    details: {
      productId,
      productName: product.name,
    },
    source: "whatsapp",
  });

  return {
    success: true,
    product: product.name,
    message: `"${product.name}" fue sacado del menú.`,
  };
}

async function ownerCheckSales(period: string, tenantId: string) {
  const now = new Date();
  let since: Date;

  switch (period) {
    case "week": {
      since = new Date(now);
      since.setDate(since.getDate() - 7);
      break;
    }
    case "month": {
      since = new Date(now);
      since.setMonth(since.getMonth() - 1);
      break;
    }
    default: {
      // today
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    }
  }

  const orderRows = await db
    .select({
      status: orders.status,
      totalAmount: orders.totalAmount,
    })
    .from(orders)
    .where(
      and(eq(orders.tenantId, tenantId), gte(orders.createdAt, since))
    );

  const totalOrders = orderRows.length;
  const totalRevenue = orderRows.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount),
    0
  );
  const pendingOrders = orderRows.filter((o) => o.status === "pending").length;
  const confirmedOrders = orderRows.filter(
    (o) => o.status === "confirmed"
  ).length;
  const deliveredOrders = orderRows.filter(
    (o) => o.status === "delivered"
  ).length;

  const periodLabel =
    period === "today" ? "hoy" : period === "week" ? "esta semana" : "este mes";

  return {
    period: periodLabel,
    totalOrders,
    totalRevenue: `$${totalRevenue.toFixed(2)}`,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
  };
}

async function ownerBroadcast(
  message: string,
  productQuery: string | undefined,
  tenantId: string
) {
  const provider = getWhatsAppProvider();

  // Get target customers
  let customerRows;
  if (productQuery) {
    // Find customers who have conversations mentioning this product
    const pattern = `%${productQuery}%`;
    customerRows = await db
      .selectDistinct({ whatsappNumber: customers.whatsappNumber })
      .from(customers)
      .innerJoin(
        conversations,
        and(
          eq(conversations.customerId, customers.id),
          eq(conversations.tenantId, tenantId)
        )
      )
      .innerJoin(
        messages,
        eq(messages.conversationId, conversations.id)
      )
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(messages.role, "user"),
          ilike(messages.content, pattern)
        )
      );
  } else {
    customerRows = await db
      .selectDistinct({ whatsappNumber: customers.whatsappNumber })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));
  }

  let sent = 0;
  let failed = 0;

  for (const c of customerRows) {
    try {
      await provider.sendMessage(c.whatsappNumber, message);
      sent++;
    } catch {
      failed++;
    }
  }

  await db.insert(changeLogs).values({
    tenantId,
    action: "broadcast",
    description: `Broadcast enviado a ${sent} cliente(s): "${message.substring(0, 100)}"`,
    details: {
      message,
      productQuery,
      sent,
      failed,
      totalTargets: customerRows.length,
    },
    source: "whatsapp",
  });

  return {
    success: true,
    sent,
    failed,
    total: customerRows.length,
    message: `Mensaje enviado a ${sent} cliente(s).`,
  };
}
