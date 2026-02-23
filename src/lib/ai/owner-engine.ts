/**
 * Owner Management AI Engine
 *
 * Processes messages from the business owner via WhatsApp,
 * allowing natural language commands to manage the business.
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { db } from "@/lib/db";
import { messages, tenants } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { buildOwnerSystemPrompt } from "./owner-prompts";
import { ownerAiTools } from "./owner-tools";
import { handleOwnerToolCall } from "./owner-tool-handlers";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (process.env.GOOGLE_AI_API_KEY) {
      _openai = new OpenAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
    } else {
      _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
  return _openai;
}

const MODEL =
  process.env.AI_MODEL ??
  (process.env.GOOGLE_AI_API_KEY ? "gemini-2.0-flash" : "gpt-4o-mini");
const MAX_CONTEXT_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 5;

interface OwnerEngineContext {
  tenantId: string;
  conversationId: string;
}

async function loadConversationHistory(
  conversationId: string
): Promise<ChatCompletionMessageParam[]> {
  const rows = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(MAX_CONTEXT_MESSAGES);

  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));
}

async function loadTenant(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return tenant;
}

/**
 * Process an owner message through the owner AI engine.
 */
export async function processOwnerMessage(
  userMessage: string,
  ctx: OwnerEngineContext
): Promise<string> {
  const tenant = await loadTenant(ctx.tenantId);
  if (!tenant) {
    return "Error: negocio no encontrado.";
  }

  const systemPrompt = buildOwnerSystemPrompt({
    businessName: tenant.businessName,
  });

  const history = await loadConversationHistory(ctx.conversationId);

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== userMessage) {
    chatMessages.push({ role: "user", content: userMessage });
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      tools: ownerAiTools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    if (!choice?.message) {
      return "Error procesando tu mensaje. ¿Podés repetirlo?";
    }

    const assistantMsg = choice.message;

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return assistantMsg.content ?? "🤔";
    }

    chatMessages.push(assistantMsg);

    for (const toolCall of assistantMsg.tool_calls) {
      if (toolCall.type !== "function") continue;

      const args = JSON.parse(toolCall.function.arguments) as Record<
        string,
        unknown
      >;
      console.log(
        `[owner-ai] Tool call: ${toolCall.function.name}(${JSON.stringify(args)})`
      );

      const result = await handleOwnerToolCall(toolCall.function.name, args, {
        tenantId: ctx.tenantId,
      });

      chatMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "Procesé demasiados pasos. ¿Podés simplificar el pedido?";
}
