import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const unitEnum = pgEnum("unit", [
  "unidad",
  "kg",
  "m2",
  "m_lineal",
  "litro",
  "docena",
  "combo",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", ["A", "B", "C"]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "closed",
  "escalated",
]);

// Tenants (businesses using VendéBot)
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  businessName: text("business_name").notNull(),
  whatsappNumber: text("whatsapp_number"),
  businessInfo: jsonb("business_info").$type<{
    address?: string;
    hours?: string;
    deliveryZones?: string[];
    description?: string;
    ivaCondition?: string;
  }>(),
  botPersonality: text("bot_personality"),
  mercadopagoAccessToken: text("mercadopago_access_token"),
  mercadopagoRefreshToken: text("mercadopago_refresh_token"),
  mercadopagoUserId: text("mercadopago_user_id"),
  afipCert: text("afip_cert"),
  afipKey: text("afip_key"),
  afipCuit: text("afip_cuit"),
  ownerPhoneNumber: text("owner_phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  unit: unitEnum("unit").notNull().default("unidad"),
  wastePercentage: numeric("waste_percentage", {
    precision: 5,
    scale: 2,
  }).default("0"),
  category: text("category"),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customers
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  whatsappNumber: text("whatsapp_number").notNull(),
  name: text("name"),
  fiscalData: jsonb("fiscal_data").$type<{
    cuit?: string;
    fiscalName?: string;
    fiscalAddress?: string;
    ivaCondition?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  items: jsonb("items")
    .notNull()
    .$type<
      Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>
    >(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentLink: text("payment_link"),
  paymentStatus: text("payment_status").default("pending"),
  mercadopagoPaymentId: text("mercadopago_payment_id"),
  mercadopagoPreferenceId: text("mercadopago_preference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id),
  whatsappNumber: text("whatsapp_number").notNull(),
  status: conversationStatusEnum("status").notNull().default("active"),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages (within conversations)
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, audio, location, interactive
  whatsappMessageId: text("whatsapp_message_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Change Logs (owner management actions)
export const changeLogActionEnum = pgEnum("change_log_action", [
  "update_price",
  "update_hours",
  "add_product",
  "remove_product",
  "update_product",
  "broadcast",
  "other",
]);

export const changeLogs = pgTable("change_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  action: changeLogActionEnum("action").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  source: text("source").notNull().default("whatsapp"), // "whatsapp" | "dashboard"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  customerId: uuid("customer_id").references(() => customers.id),
  invoiceType: invoiceTypeEnum("invoice_type").notNull(),
  cae: text("cae"),
  caeExpiry: timestamp("cae_expiry"),
  pointOfSale: integer("point_of_sale"),
  invoiceNumber: integer("invoice_number"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
