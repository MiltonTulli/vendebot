/**
 * Default message handler — processes incoming WhatsApp messages.
 *
 * Currently: echo bot + DB storage.
 * Phase 2 will replace this with AI engine processing.
 */

import { db } from "@/lib/db";
import { conversations, messages, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import type { IncomingMessageJob } from "./index";

/**
 * Find or create a conversation for the given WhatsApp number.
 */
async function getOrCreateConversation(whatsappNumber: string, tenantId: string) {
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.whatsappNumber, whatsappNumber),
        eq(conversations.tenantId, tenantId),
        eq(conversations.status, "active")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Find or create customer
  const customer = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.whatsappNumber, whatsappNumber),
        eq(customers.tenantId, tenantId)
      )
    )
    .limit(1);

  let customerId: string;
  if (customer.length > 0) {
    customerId = customer[0].id;
  } else {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId,
        whatsappNumber,
      })
      .returning();
    customerId = newCustomer.id;
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      tenantId,
      customerId,
      whatsappNumber,
      status: "active",
    })
    .returning();

  return conversation;
}

/**
 * Convert message content to display text.
 */
function contentToText(content: IncomingMessageJob["content"]): string {
  switch (content.type) {
    case "text":
      return content.body ?? "";
    case "image":
      return content.caption ?? "[Imagen]";
    case "audio":
      return "[Audio]";
    case "location":
      return `[Ubicación: ${content.latitude}, ${content.longitude}]`;
    case "interactive_reply":
      return content.title ?? "";
    default:
      return "[Mensaje no soportado]";
  }
}

/**
 * Handle an incoming message: store in DB, generate response, send reply.
 */
export async function handleIncomingMessage(job: IncomingMessageJob): Promise<void> {
  const tenantId = process.env.DEFAULT_TENANT_ID;
  const provider = getWhatsAppProvider();
  const text = contentToText(job.content);

  if (!tenantId) {
    // No tenant configured — just echo without DB
    console.warn("[handler] No DEFAULT_TENANT_ID, echoing without DB");
    await provider.sendMessage(job.from, `Recibido: ${text}`);
    return;
  }

  // Store in DB
  const conversation = await getOrCreateConversation(job.from, tenantId);

  // Save incoming message
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "user",
    content: text,
    messageType: job.content.type,
    whatsappMessageId: job.messageId,
    metadata: job.raw ? { raw: job.raw } : undefined,
  });

  // TODO: Phase 2 — Replace echo with AI engine
  const echoText = `Recibido: ${text}`;
  const result = await provider.sendMessage(job.from, echoText);

  // Save bot response
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: echoText,
    messageType: "text",
    whatsappMessageId: result.messageId ?? undefined,
  });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversation.id));

  console.log(`[handler] Processed message from ${job.from}: "${text.substring(0, 50)}"`);
}
