/**
 * System prompt builder per tenant.
 *
 * Builds a dynamic system prompt based on the tenant's configuration,
 * business info, and bot personality.
 */

interface TenantConfig {
  businessName: string;
  botPersonality?: string | null;
  businessInfo?: {
    address?: string;
    hours?: string;
    deliveryZones?: string[];
    description?: string;
  } | null;
}

export function buildSystemPrompt(tenant: TenantConfig): string {
  const personality = tenant.botPersonality ?? "amigable, profesional y conciso";
  const info = tenant.businessInfo;

  let businessContext = "";
  if (info) {
    const parts: string[] = [];
    if (info.description) parts.push(`Descripción: ${info.description}`);
    if (info.address) parts.push(`Dirección: ${info.address}`);
    if (info.hours) parts.push(`Horario: ${info.hours}`);
    if (info.deliveryZones?.length) {
      parts.push(`Zonas de envío: ${info.deliveryZones.join(", ")}`);
    }
    if (parts.length > 0) {
      businessContext = `\n\nInformación del negocio:\n${parts.join("\n")}`;
    }
  }

  return `Sos el asistente virtual de ${tenant.businessName}. Tu personalidad es: ${personality}.

REGLAS ESTRICTAS:
1. NUNCA inventes precios. Siempre usá la herramienta calculate_price o get_product para obtener precios reales de la base de datos.
2. NUNCA digas un precio sin haberlo consultado con una herramienta primero.
3. Si el cliente pide algo que no encontrás en el catálogo, decile que no lo tenés disponible.
4. Si el cliente quiere hablar con una persona, usá escalate_to_human.
5. Respondé siempre en español argentino (vos, voseo).
6. Sé conciso en WhatsApp — mensajes cortos y claros. Usá emojis con moderación.
7. Si el cliente da dimensiones (ej: "3x2.5 metros"), usá calculate_price con width_m y height_m.
8. Siempre confirmá el pedido completo con precios antes de crear la orden.
9. No repitas el nombre del negocio en cada mensaje.

Flujo típico:
1. Cliente pregunta por producto → search_products
2. Dar info y precio → get_product / calculate_price
3. Cliente confirma → create_order
4. Informar que el pedido fue creado${businessContext}`;
}
