/**
 * Tool handler implementations.
 *
 * Each function executes the corresponding AI tool and returns
 * a JSON-serializable result for the AI to interpret.
 */

import { db } from "@/lib/db";
import { products, tenants, orders, customers, conversations } from "@/lib/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { createCheckoutPreference } from "@/lib/mercadopago";

interface ToolContext {
  tenantId: string;
  whatsappNumber: string;
  conversationId: string;
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "search_products":
      return searchProducts(args.query as string, ctx.tenantId);
    case "get_product":
      return getProduct(args.id as string, ctx.tenantId);
    case "calculate_price":
      return calculatePrice(
        args.product_id as string,
        args.quantity as number,
        ctx.tenantId,
        args.width_m as number | undefined,
        args.height_m as number | undefined
      );
    case "check_availability":
      return checkAvailability(args.product_id as string, ctx.tenantId);
    case "create_order":
      return createOrder(
        args.items as Array<{
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total: number;
        }>,
        args.notes as string | undefined,
        ctx
      );
    case "get_business_info":
      return getBusinessInfo(ctx.tenantId);
    case "escalate_to_human":
      return escalateToHuman(args.reason as string, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function searchProducts(query: string, tenantId: string) {
  const pattern = `%${query}%`;
  const results = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
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
    return { message: "No se encontraron productos con esa búsqueda.", results: [] };
  }

  return {
    message: `Se encontraron ${results.length} producto(s).`,
    results: results.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: `$${p.price}`,
      unit: p.unit,
      category: p.category,
      available: p.inStock,
    })),
  };
}

async function getProduct(id: string, tenantId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return { error: "Producto no encontrado." };
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: `$${product.price}`,
    unit: product.unit,
    wastePercentage: product.wastePercentage,
    category: product.category,
    available: product.inStock,
    imageUrl: product.imageUrl,
  };
}

async function calculatePrice(
  productId: string,
  quantity: number,
  tenantId: string,
  widthM?: number,
  heightM?: number
) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return { error: "Producto no encontrado." };
  }

  const unitPrice = parseFloat(product.price);
  const wastePct = parseFloat(product.wastePercentage ?? "0");

  let effectiveQuantity = quantity;

  // For m² products, calculate area from dimensions if provided
  if (product.unit === "m2" && widthM && heightM) {
    effectiveQuantity = widthM * heightM * quantity;
  }

  // Apply waste percentage
  const withWaste = effectiveQuantity * (1 + wastePct / 100);
  const total = withWaste * unitPrice;

  return {
    product: product.name,
    unitPrice: `$${unitPrice.toFixed(2)}`,
    unit: product.unit,
    requestedQuantity: effectiveQuantity,
    wastePercentage: `${wastePct}%`,
    quantityWithWaste: parseFloat(withWaste.toFixed(4)),
    total: `$${total.toFixed(2)}`,
    totalNumeric: parseFloat(total.toFixed(2)),
  };
}

async function checkAvailability(productId: string, tenantId: string) {
  const [product] = await db
    .select({ name: products.name, inStock: products.inStock })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
    .limit(1);

  if (!product) {
    return { error: "Producto no encontrado." };
  }

  return {
    product: product.name,
    available: product.inStock,
    message: product.inStock
      ? `${product.name} está disponible.`
      : `${product.name} no está disponible en este momento.`,
  };
}

async function createOrder(
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>,
  notes: string | undefined,
  ctx: ToolContext
) {
  // Find or get customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.whatsappNumber, ctx.whatsappNumber),
        eq(customers.tenantId, ctx.tenantId)
      )
    )
    .limit(1);

  if (!customer) {
    return { error: "Cliente no encontrado." };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const orderItems = items.map((item) => ({
    productId: item.product_id,
    productName: item.product_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    total: item.total,
  }));

  const [order] = await db
    .insert(orders)
    .values({
      tenantId: ctx.tenantId,
      customerId: customer.id,
      status: "pending",
      items: orderItems,
      totalAmount: totalAmount.toFixed(2),
      notes,
    })
    .returning();

  // Try to generate MercadoPago payment link if tenant has MP connected
  let paymentLink: string | null = null;
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (tenant?.mercadopagoAccessToken) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://vendebot.vercel.app";
      const preference = await createCheckoutPreference({
        accessToken: tenant.mercadopagoAccessToken,
        orderId: order.id,
        items: orderItems.map((i) => ({
          title: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        notificationUrl: `${appUrl}/api/mercadopago/webhook`,
      });

      paymentLink = preference.initPoint;

      await db
        .update(orders)
        .set({
          paymentLink: preference.initPoint,
          mercadopagoPreferenceId: preference.preferenceId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }
  } catch (err) {
    console.error("Failed to create MP payment link:", err);
  }

  const result: Record<string, unknown> = {
    success: true,
    orderId: order.id,
    totalAmount: `$${totalAmount.toFixed(2)}`,
    itemCount: items.length,
    message: `Pedido #${order.id.slice(0, 8)} creado por $${totalAmount.toFixed(2)}. Estado: pendiente.`,
  };

  if (paymentLink) {
    result.paymentLink = paymentLink;
    result.message = `Pedido #${order.id.slice(0, 8)} creado por $${totalAmount.toFixed(2)}. Podés pagar acá: ${paymentLink}`;
  }

  return result;
}

async function getBusinessInfo(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { error: "Negocio no encontrado." };
  }

  return {
    name: tenant.businessName,
    whatsappNumber: tenant.whatsappNumber,
    address: tenant.businessInfo?.address ?? "No especificada",
    hours: tenant.businessInfo?.hours ?? "No especificado",
    deliveryZones: tenant.businessInfo?.deliveryZones ?? [],
    description: tenant.businessInfo?.description ?? "",
  };
}

async function escalateToHuman(reason: string, ctx: ToolContext) {
  // Mark conversation as escalated
  await db
    .update(conversations)
    .set({ status: "escalated", updatedAt: new Date() })
    .where(eq(conversations.id, ctx.conversationId));

  // TODO: Phase 5 — notify owner via WhatsApp

  return {
    success: true,
    message:
      "La conversación fue derivada al dueño del negocio. Te van a responder a la brevedad.",
    reason,
  };
}
