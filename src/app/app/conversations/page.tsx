import { db } from "@/lib/db";
import { conversations, customers, messages } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getCurrentTenantId } from "@/lib/db/get-tenant";
import { ConversationsClient } from "./conversations-client";

export default async function ConversationsPage() {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return <div className="py-12 text-center text-muted-foreground">Configurá tu cuenta primero.</div>;
  }

  // Get conversations with last message
  const convRows = await db
    .select({
      id: conversations.id,
      whatsappNumber: conversations.whatsappNumber,
      status: conversations.status,
      updatedAt: conversations.updatedAt,
      customerName: customers.name,
      customerPhone: customers.whatsappNumber,
    })
    .from(conversations)
    .leftJoin(customers, eq(conversations.customerId, customers.id))
    .where(eq(conversations.tenantId, tenantId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  // Get messages for each conversation (batch)
  const convIds = convRows.map((c) => c.id);
  const allMessages = convIds.length > 0
    ? await db
        .select({
          conversationId: messages.conversationId,
          role: messages.role,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(sql`${messages.conversationId} = ANY(${convIds})`)
        .orderBy(messages.createdAt)
    : [];

  const messagesByConv = new Map<string, typeof allMessages>();
  for (const m of allMessages) {
    const arr = messagesByConv.get(m.conversationId) ?? [];
    arr.push(m);
    messagesByConv.set(m.conversationId, arr);
  }

  const serialized = convRows.map((c) => {
    const msgs = messagesByConv.get(c.id) ?? [];
    const lastMsg = msgs[msgs.length - 1];
    return {
      id: c.id,
      customer: c.customerName ?? c.whatsappNumber,
      phone: c.customerPhone ?? c.whatsappNumber,
      status: c.status as "active" | "escalated" | "closed",
      lastMessage: lastMsg?.content ?? "",
      lastTime: c.updatedAt.toISOString(),
      unread: 0, // TODO: track unread count
      messages: msgs.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        time: m.createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      })),
    };
  });

  return <ConversationsClient conversations={serialized} />;
}
