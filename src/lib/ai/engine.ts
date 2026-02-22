/**
 * AI Engine — OpenAI integration with function calling.
 *
 * Manages conversation with the AI model, executes tool calls,
 * and returns the final response text.
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { db } from "@/lib/db";
import { messages, tenants } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { buildSystemPrompt } from "./prompts";
import { aiTools } from "./tools";
import { handleToolCall } from "./tool-handlers";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
const MAX_CONTEXT_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 5;

interface EngineContext {
  tenantId: string;
  conversationId: string;
  whatsappNumber: string;
}

/**
 * Load recent conversation history from DB as OpenAI messages.
 */
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

/**
 * Load tenant config for system prompt.
 */
async function loadTenant(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return tenant;
}

/**
 * Process a user message through the AI engine.
 * Returns the assistant's final text response.
 */
export async function processWithAI(
  userMessage: string,
  ctx: EngineContext
): Promise<string> {
  const tenant = await loadTenant(ctx.tenantId);
  if (!tenant) {
    return "Lo siento, hay un problema con la configuración. Intentá más tarde.";
  }

  const systemPrompt = buildSystemPrompt({
    businessName: tenant.businessName,
    botPersonality: tenant.botPersonality,
    businessInfo: tenant.businessInfo,
  });

  // Load conversation history (excluding the current message, which is already saved)
  const history = await loadConversationHistory(ctx.conversationId);

  // Build messages array
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  // If the last message in history isn't the current user message, add it
  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== userMessage) {
    chatMessages.push({ role: "user", content: userMessage });
  }

  // Run completion loop with tool calls
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      tools: aiTools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    if (!choice?.message) {
      return "Disculpá, no pude procesar tu mensaje. ¿Podés repetirlo?";
    }

    const assistantMsg = choice.message;

    // If no tool calls, return the text response
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return assistantMsg.content ?? "🤔";
    }

    // Add assistant message with tool calls to context
    chatMessages.push(assistantMsg);

    // Execute each tool call
    for (const toolCall of assistantMsg.tool_calls) {
      if (toolCall.type !== "function") continue;

      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

      console.log(`[ai] Tool call: ${toolCall.function.name}(${JSON.stringify(args)})`);

      const result = await handleToolCall(toolCall.function.name, args, {
        tenantId: ctx.tenantId,
        whatsappNumber: ctx.whatsappNumber,
        conversationId: ctx.conversationId,
      });

      chatMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "Disculpá, tardé demasiado procesando. ¿Podés simplificar tu consulta?";
}
