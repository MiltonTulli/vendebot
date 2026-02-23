/**
 * WhatsApp status updates when order state changes
 */

import { getWhatsAppProvider } from "@/lib/whatsapp";
import { getTrackingUrl } from "./order-tracking";

const STATUS_MESSAGES: Record<string, string> = {
  confirmed:
    "✅ ¡Tu pedido #{orderId} fue confirmado! Estamos preparándolo.\n\n📦 Seguí tu pedido: {trackingUrl}",
  preparing:
    "👨‍🍳 Tu pedido #{orderId} se está preparando. ¡Ya falta poco!",
  ready:
    "🎉 ¡Tu pedido #{orderId} está listo! Podés pasar a retirarlo o te lo enviamos.",
  delivered:
    "📬 Tu pedido #{orderId} fue entregado. ¡Gracias por tu compra! Esperamos verte pronto. 😊",
  cancelled:
    "❌ Tu pedido #{orderId} fue cancelado. Si tenés dudas, escribinos.",
};

interface OrderStatusUpdateParams {
  customerPhone: string;
  orderId: string;
  newStatus: string;
  trackingToken?: string;
}

/**
 * Send a WhatsApp message to the customer when order status changes
 */
export async function sendOrderStatusUpdate({
  customerPhone,
  orderId,
  newStatus,
  trackingToken,
}: OrderStatusUpdateParams) {
  const template = STATUS_MESSAGES[newStatus];
  if (!template) return; // No message for this status (e.g., "pending")

  const trackingUrl = trackingToken ? getTrackingUrl(trackingToken) : "";
  const shortId = orderId.slice(0, 8).toUpperCase();

  const message = template
    .replace("{orderId}", shortId)
    .replace("{trackingUrl}", trackingUrl);

  const provider = getWhatsAppProvider();
  await provider.sendMessage(customerPhone, message);
}
