/**
 * WhatsApp module — re-exports + factory
 */

export type {
  WhatsAppProvider,
  OutboundMessage,
  IncomingMessage,
  IncomingMessageContent,
  SendResult,
} from "./provider";

export { TwilioWhatsAppProvider, createTwilioProvider } from "./twilio";
export { MetaWhatsAppProvider } from "./meta";

import type { WhatsAppProvider } from "./provider";
import { createTwilioProvider } from "./twilio";

/** Get the active WhatsApp provider based on env config */
export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER ?? "twilio";

  switch (provider) {
    case "twilio":
      return createTwilioProvider();
    case "meta":
      throw new Error("Meta Cloud API provider not yet implemented");
    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}
