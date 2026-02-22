/**
 * Twilio WhatsApp Provider Implementation
 */

import Twilio from "twilio";
import type {
  WhatsAppProvider,
  SendResult,
  TemplateMessage,
  InteractiveButtonsMessage,
  InteractiveListMessage,
  IncomingMessage,
  IncomingMessageContent,
} from "./provider";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // e.g. "whatsapp:+14155238886" (sandbox) or your Twilio number
}

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  readonly name = "twilio";
  private client: ReturnType<typeof Twilio>;
  private fromNumber: string;
  private authToken: string;

  constructor(config: TwilioConfig) {
    this.client = Twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
    this.authToken = config.authToken;
  }

  private formatNumber(number: string): string {
    // Ensure whatsapp: prefix
    if (number.startsWith("whatsapp:")) return number;
    // Ensure + prefix
    const cleaned = number.startsWith("+") ? number : `+${number}`;
    return `whatsapp:${cleaned}`;
  }

  async sendMessage(to: string, body: string): Promise<SendResult> {
    try {
      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: this.formatNumber(to),
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: msg };
    }
  }

  async sendTemplate(message: TemplateMessage): Promise<SendResult> {
    // Twilio uses Content Templates — requires pre-approved templates in Twilio console
    // For now, send as a plain text message with a note
    // TODO: Integrate Twilio Content API for proper templates
    const paramText = message.parameters?.map((p) => p.text).join(", ") ?? "";
    return this.sendMessage(
      message.to,
      `[Template: ${message.templateName}] ${paramText}`
    );
  }

  async sendInteractiveButtons(
    message: InteractiveButtonsMessage
  ): Promise<SendResult> {
    // Twilio supports interactive messages via Content API
    // Fallback: send text with numbered options
    const buttonList = message.buttons
      .map((b, i) => `${i + 1}. ${b.title}`)
      .join("\n");
    const body = [
      message.header ? `*${message.header}*\n` : "",
      message.body,
      "\n",
      buttonList,
      message.footer ? `\n_${message.footer}_` : "",
    ]
      .filter(Boolean)
      .join("");

    return this.sendMessage(message.to, body);
  }

  async sendList(message: InteractiveListMessage): Promise<SendResult> {
    // Fallback: send text with sections and numbered options
    const sections = message.sections
      .map((section) => {
        const rows = section.rows
          .map((r) => `  • ${r.title}${r.description ? ` — ${r.description}` : ""}`)
          .join("\n");
        return `*${section.title}*\n${rows}`;
      })
      .join("\n\n");

    const body = [
      message.header ? `*${message.header}*\n` : "",
      message.body,
      "\n\n",
      sections,
      message.footer ? `\n_${message.footer}_` : "",
    ]
      .filter(Boolean)
      .join("");

    return this.sendMessage(message.to, body);
  }

  parseWebhook(
    body: unknown,
    _headers?: Record<string, string>
  ): IncomingMessage | null {
    const data = body as Record<string, string | undefined>;

    const messageSid = data.MessageSid ?? data.SmsSid;
    const from = data.From; // "whatsapp:+549..."
    const to = data.To;
    const bodyText = data.Body;

    if (!messageSid || !from || !to) return null;

    // Strip whatsapp: prefix for normalized format
    const fromClean = from.replace("whatsapp:", "");
    const toClean = to.replace("whatsapp:", "");

    // Determine content type
    let content: IncomingMessageContent;

    const numMedia = parseInt(data.NumMedia ?? "0", 10);
    const latitude = data.Latitude;
    const longitude = data.Longitude;
    const buttonPayload = data.ButtonPayload;
    const listId = data.ListId;

    if (latitude && longitude) {
      content = {
        type: "location",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: data.LocationLabel,
        address: data.LocationAddress,
      };
    } else if (buttonPayload || listId) {
      content = {
        type: "interactive_reply",
        buttonId: buttonPayload,
        listRowId: listId,
        title: bodyText ?? "",
      };
    } else if (numMedia > 0) {
      const mediaType = (data.MediaContentType0 ?? "").toLowerCase();
      if (mediaType.startsWith("audio/")) {
        content = {
          type: "audio",
          mediaUrl: data.MediaUrl0 ?? "",
        };
      } else if (mediaType.startsWith("image/")) {
        content = {
          type: "image",
          mediaUrl: data.MediaUrl0 ?? "",
          caption: bodyText,
        };
      } else {
        // Default to text for unsupported media types
        content = {
          type: "text",
          body: bodyText ?? `[Unsupported media: ${mediaType}]`,
        };
      }
    } else {
      content = {
        type: "text",
        body: bodyText ?? "",
      };
    }

    return {
      messageId: messageSid,
      from: fromClean,
      to: toClean,
      content,
      timestamp: new Date(),
      provider: this.name,
      raw: body,
    };
  }

  validateWebhook(
    body: unknown,
    headers: Record<string, string>
  ): boolean {
    // Twilio signs requests with X-Twilio-Signature
    const signature = headers["x-twilio-signature"] ?? headers["X-Twilio-Signature"];
    if (!signature) return false;

    // Use Twilio's built-in validation
    const url = headers["x-forwarded-proto"]
      ? `${headers["x-forwarded-proto"]}://${headers["host"]}${headers["x-original-url"] ?? ""}`
      : "";

    if (!url) {
      // Can't validate without the full URL — skip in dev
      console.warn("[twilio] Cannot validate webhook signature without full URL");
      return true;
    }

    return Twilio.validateRequest(
      this.authToken,
      signature,
      url,
      body as Record<string, string>
    );
  }
}

/** Create a Twilio provider from environment variables */
export function createTwilioProvider(): TwilioWhatsAppProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing Twilio config. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM"
    );
  }

  return new TwilioWhatsAppProvider({ accountSid, authToken, fromNumber });
}
