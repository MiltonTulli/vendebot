/**
 * Meta Cloud API WhatsApp Provider — Stub
 *
 * Placeholder for future migration from Twilio to Meta's direct Cloud API.
 * Not yet implemented.
 */

import type {
  WhatsAppProvider,
  SendResult,
  TemplateMessage,
  InteractiveButtonsMessage,
  InteractiveListMessage,
  IncomingMessage,
} from "./provider";

const NOT_IMPLEMENTED: SendResult = {
  success: false,
  error: "Meta Cloud API provider not yet implemented",
};

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = "meta";

  async sendMessage(_to: string, _body: string): Promise<SendResult> {
    return NOT_IMPLEMENTED;
  }

  async sendTemplate(_message: TemplateMessage): Promise<SendResult> {
    return NOT_IMPLEMENTED;
  }

  async sendInteractiveButtons(
    _message: InteractiveButtonsMessage
  ): Promise<SendResult> {
    return NOT_IMPLEMENTED;
  }

  async sendList(_message: InteractiveListMessage): Promise<SendResult> {
    return NOT_IMPLEMENTED;
  }

  parseWebhook(
    _body: unknown,
    _headers?: Record<string, string>
  ): IncomingMessage | null {
    return null;
  }

  validateWebhook(
    _body: unknown,
    _headers: Record<string, string>
  ): boolean {
    return false;
  }
}
