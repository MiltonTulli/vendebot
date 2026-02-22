/**
 * Default message handler — processes incoming WhatsApp messages.
 *
 * Routes messages through the AI engine when OPENAI_API_KEY is set,
 * falls back to echo bot otherwise.
 */

import { db } from "@/lib/db";
import { conversations, messages, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { processWithAI } from "@/lib/ai";
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
      return content.caption ?? "[Imagen recibida]";
    case "audio":
      return "[Audio recibido]";
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

  // Generate response — AI engine or echo fallback
  let responseText: string;

  if (process.env.OPENAI_API_KEY) {
    try {
      responseText = await processWithAI(text, {
        tenantId,
        conversationId: conversation.id,
        whatsappNumber: job.from,
      });
    } catch (error) {
      console.error("[handler] AI engine error:", error);
      responseText =
        "Disculpá, tuve un problema procesando tu mensaje. ¿Podés intentar de nuevo?";
    }
  } else {
    responseText = `Recibido: ${text}`;
  }

  const result = await provider.sendMessage(job.from, responseText);

  // Save bot response
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: responseText,
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
