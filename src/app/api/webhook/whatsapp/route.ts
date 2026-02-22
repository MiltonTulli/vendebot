/**
 * WhatsApp Webhook Endpoint
 *
 * Receives incoming messages from the WhatsApp provider (Twilio/Meta),
 * responds immediately with 200 OK, then processes the message
 * asynchronously using Next.js `after()`.
 */

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getWhatsAppProvider } from "@/lib/whatsapp";
import { processMessage, registerMessageHandler } from "@/lib/queue";
import { handleIncomingMessage } from "@/lib/queue/handler";
import type { IncomingMessageJob } from "@/lib/queue";

// Register the default message handler
registerMessageHandler(handleIncomingMessage);

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

    // Build the job
    const job: IncomingMessageJob = {
      from: incoming.from,
      content: incoming.content as IncomingMessageJob["content"],
      messageId: incoming.messageId,
      raw: incoming.raw,
      receivedAt: new Date(),
    };

    // Process asynchronously — webhook responds immediately
    after(async () => {
      await processMessage(job);
    });

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
