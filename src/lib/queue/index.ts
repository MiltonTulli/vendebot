/**
 * Message Queue — Async message processing
 *
 * Uses Next.js `after()` to process incoming WhatsApp messages
 * after the webhook has already responded with 200 OK.
 *
 * This keeps webhook response times fast (Twilio/Meta require < 15s)
 * and decouples receiving from processing.
 *
 * Future: swap to a real queue (Redis/BullMQ, Inngest, etc.)
 * by implementing the MessageProcessor interface differently.
 */

export interface IncomingMessageJob {
  /** Sender's WhatsApp number */
  from: string;
  /** Parsed message content */
  content: {
    type: string;
    body?: string;
    caption?: string;
    title?: string;
    latitude?: number;
    longitude?: number;
    mediaUrl?: string;
  };
  /** WhatsApp message ID */
  messageId?: string;
  /** Raw webhook payload */
  raw?: unknown;
  /** Timestamp received */
  receivedAt: Date;
}

export type MessageHandler = (job: IncomingMessageJob) => Promise<void>;

let _handler: MessageHandler | null = null;

/**
 * Register the message processing handler.
 * Called once at app init (e.g., in the webhook route or a setup module).
 */
export function registerMessageHandler(handler: MessageHandler): void {
  _handler = handler;
}

/**
 * Get the registered handler, or throw if none registered.
 */
export function getMessageHandler(): MessageHandler {
  if (!_handler) {
    throw new Error("No message handler registered. Call registerMessageHandler() first.");
  }
  return _handler;
}

/**
 * Enqueue a message for async processing.
 * In the current implementation, this just calls the handler directly
 * (intended to be used inside `after()`).
 *
 * Returns immediately — caller should wrap in `after()` for true async.
 */
export async function processMessage(job: IncomingMessageJob): Promise<void> {
  const handler = getMessageHandler();

  try {
    await handler(job);
  } catch (error) {
    console.error(`[queue] Failed to process message from ${job.from}:`, error);
    // TODO: Dead letter queue / retry logic
  }
}
