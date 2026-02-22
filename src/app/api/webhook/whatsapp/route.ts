/**
 * WhatsApp Webhook Endpoint
 *
 * Receives incoming messages from the WhatsApp provider (Twilio/Meta),
 * stores conversation + message in DB, and responds with an echo.
 */

import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { db } from "@/lib/db";
import { conversations, messages, customers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Find or create a conversation for the given whatsapp number.
 * For now, we use a hardcoded tenant (single-tenant dev mode).
 * TODO: Route to correct tenant based on the "to" number.
 */
async function getOrCreateConversation(whatsappNumber: string, tenantId: string) {
  // Find existing active conversation
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
  let customer = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.whatsappNumber, whatsappNumber),
        eq(customers.tenantId, tenantId)
      )
    )
    .limit(1);

  let customerId: string | null = null;
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

  // Create new conversation
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
 * Extract a text representation from any incoming message content.
 */
function contentToText(content: { type: string; body?: string; caption?: string; title?: string; latitude?: number; longitude?: number; mediaUrl?: string }): string {
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

export async function POST(request: NextRequest) {
  try {
    // Parse form-urlencoded body (Twilio sends this format)
    const contentType = request.headers.get("content-type") ?? "";
    let body: unknown;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const obj: Record<string, string> = {};
      formData.forEach((value, key) => {
        obj[key] = value.toString();
      });
      body = obj;
    } else {
      body = await request.json();
    }

    // Get headers for validation
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const provider = getWhatsAppProvider();

    // Parse the webhook payload
    const incoming = provider.parseWebhook(body, headers);
    if (!incoming) {
      console.warn("[webhook] Could not parse incoming message", body);
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    console.log(`[webhook] Incoming ${incoming.content.type} from ${incoming.from}`);

    // For dev/sandbox: use a default tenant ID from env, or skip DB if not set
    const tenantId = process.env.DEFAULT_TENANT_ID;
    if (!tenantId) {
      // No tenant configured — just echo without DB
      console.warn("[webhook] No DEFAULT_TENANT_ID set, echoing without DB storage");
      const text = contentToText(incoming.content as Parameters<typeof contentToText>[0]);
      await provider.sendMessage(incoming.from, `Recibido: ${text}`);
      return NextResponse.json({ ok: true });
    }

    // Store in DB
    const conversation = await getOrCreateConversation(incoming.from, tenantId);
    const text = contentToText(incoming.content as Parameters<typeof contentToText>[0]);

    // Save incoming message
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "user",
      content: text,
      messageType: incoming.content.type,
      whatsappMessageId: incoming.messageId,
      metadata: incoming.raw ? { raw: incoming.raw } : undefined,
    });

    // Echo bot response
    const echoText = `Recibido: ${text}`;
    const result = await provider.sendMessage(incoming.from, echoText);

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] Error processing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET handler for webhook verification (used by Meta, not Twilio) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
