/**
 * WhatsApp Provider Abstraction Layer
 *
 * Defines a common interface for sending WhatsApp messages,
 * allowing swappable implementations (Twilio, Meta Cloud API, etc.)
 */

// --- Message Types ---

export interface TextMessage {
  type: "text";
  to: string;
  body: string;
}

export interface TemplateMessage {
  type: "template";
  to: string;
  templateName: string;
  language: string;
  parameters?: Array<{ type: "text"; text: string }>;
}

export interface InteractiveButtonsMessage {
  type: "interactive_buttons";
  to: string;
  body: string;
  header?: string;
  footer?: string;
  buttons: Array<{ id: string; title: string }>;
}

export interface InteractiveListMessage {
  type: "interactive_list";
  to: string;
  body: string;
  header?: string;
  footer?: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

export type OutboundMessage =
  | TextMessage
  | TemplateMessage
  | InteractiveButtonsMessage
  | InteractiveListMessage;

// --- Incoming Message Types ---

export interface IncomingTextMessage {
  type: "text";
  body: string;
}

export interface IncomingImageMessage {
  type: "image";
  mediaUrl: string;
  caption?: string;
}

export interface IncomingAudioMessage {
  type: "audio";
  mediaUrl: string;
}

export interface IncomingLocationMessage {
  type: "location";
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface IncomingInteractiveReply {
  type: "interactive_reply";
  buttonId?: string;
  listRowId?: string;
  title: string;
}

export type IncomingMessageContent =
  | IncomingTextMessage
  | IncomingImageMessage
  | IncomingAudioMessage
  | IncomingLocationMessage
  | IncomingInteractiveReply;

export interface IncomingMessage {
  /** Provider-specific message ID */
  messageId: string;
  /** Sender's WhatsApp number (E.164 format) */
  from: string;
  /** Recipient number (the business number) */
  to: string;
  /** Parsed message content */
  content: IncomingMessageContent;
  /** Raw timestamp from provider */
  timestamp: Date;
  /** Provider name for tracing */
  provider: string;
  /** Raw payload for debugging */
  raw?: unknown;
}

// --- Send Result ---

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// --- Provider Interface ---

export interface WhatsAppProvider {
  readonly name: string;

  /** Send a text message */
  sendMessage(to: string, body: string): Promise<SendResult>;

  /** Send a template message (for outbound-initiated conversations) */
  sendTemplate(message: TemplateMessage): Promise<SendResult>;

  /** Send interactive buttons */
  sendInteractiveButtons(
    message: InteractiveButtonsMessage
  ): Promise<SendResult>;

  /** Send an interactive list */
  sendList(message: InteractiveListMessage): Promise<SendResult>;

  /** Parse raw webhook body into a normalized IncomingMessage */
  parseWebhook(body: unknown, headers?: Record<string, string>): IncomingMessage | null;

  /** Validate webhook signature (if applicable) */
  validateWebhook(body: unknown, headers: Record<string, string>): boolean;
}
