"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Bot,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const demoConversations = [
  {
    id: "1",
    customer: "María García",
    phone: "+54 9 11 1234-5678",
    status: "active" as const,
    lastMessage: "Perfecto, quiero 2 docenas",
    lastTime: "Hace 2 min",
    unread: 2,
    messages: [
      { role: "user", content: "Hola, tienen empanadas?", time: "18:25" },
      { role: "assistant", content: "¡Hola María! Sí, tenemos empanadas de carne, pollo, jamón y queso, y verdura. La unidad sale $850. ¿Cuántas querés?", time: "18:25" },
      { role: "user", content: "Perfecto, quiero 2 docenas de carne", time: "18:28" },
      { role: "assistant", content: "¡Genial! 24 empanadas de carne × $850 = $20.400. ¿Confirmás el pedido?", time: "18:28" },
    ],
  },
  {
    id: "2",
    customer: "Pedro Sánchez",
    phone: "+54 9 11 8888-1234",
    status: "escalated" as const,
    lastMessage: "Necesito hablar con alguien",
    lastTime: "Hace 8 min",
    unread: 1,
    messages: [
      { role: "user", content: "Hola, hice un pedido ayer y no llegó", time: "18:15" },
      { role: "assistant", content: "Lamento mucho eso, Pedro. Dejame verificar tu pedido. ¿Tenés el número de pedido?", time: "18:15" },
      { role: "user", content: "No lo tengo, necesito hablar con alguien", time: "18:20" },
      { role: "system", content: "🔔 Conversación escalada: el cliente quiere hablar con una persona", time: "18:20" },
    ],
  },
  {
    id: "3",
    customer: "Lucía Torres",
    phone: "+54 9 11 7777-5678",
    status: "closed" as const,
    lastMessage: "Gracias, quedó todo genial 🙌",
    lastTime: "Hace 15 min",
    unread: 0,
    messages: [
      { role: "user", content: "Hola! Llegó el pedido, todo perfecto", time: "18:05" },
      { role: "assistant", content: "¡Qué bueno, Lucía! Nos alegra que esté todo bien. ¡Hasta la próxima! 😊", time: "18:05" },
      { role: "user", content: "Gracias, quedó todo genial 🙌", time: "18:08" },
    ],
  },
  {
    id: "4",
    customer: "Martín Díaz",
    phone: "+54 9 11 6666-9876",
    status: "active" as const,
    lastMessage: "¿Hacen delivery a Palermo?",
    lastTime: "Hace 30 min",
    unread: 0,
    messages: [
      { role: "user", content: "Buenas, ¿hacen delivery a Palermo?", time: "17:50" },
      { role: "assistant", content: "¡Hola Martín! Sí, hacemos delivery a Palermo. El envío tiene un costo de $1.500. ¿Querés ver nuestro menú?", time: "17:50" },
    ],
  },
];

const statusConfig = {
  active: { label: "Activa", variant: "secondary" as const },
  escalated: { label: "Escalada", variant: "destructive" as const },
  closed: { label: "Cerrada", variant: "outline" as const },
};

export default function ConversationsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(demoConversations[0]);
  const [manualMessage, setManualMessage] = useState("");

  const filtered = demoConversations.filter(
    (c) =>
      !search ||
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 -m-6">
      {/* Conversation list */}
      <div className="flex w-80 shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`flex w-full items-start gap-3 border-b p-3 text-left hover:bg-muted/50 transition-colors ${
                selected.id === conv.id ? "bg-muted/70" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{conv.customer}</span>
                  <span className="text-xs text-muted-foreground">{conv.lastTime}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {conv.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {conv.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {conv.unread}
                  </span>
                )}
                {conv.status === "escalated" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{selected.customer}</span>
                <Badge variant={statusConfig[selected.status].variant}>
                  {statusConfig[selected.status].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{selected.phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {selected.status === "escalated" && (
              <Button size="sm" variant="destructive">
                <Phone className="mr-2 h-3.5 w-3.5" />
                Tomar conversación
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selected.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                msg.role === "user"
                  ? "justify-start"
                  : msg.role === "system"
                  ? "justify-center"
                  : "justify-end"
              }`}
            >
              {msg.role === "system" ? (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-300">
                  {msg.content}
                </div>
              ) : (
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      msg.role === "user"
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    }`}
                  >
                    {msg.role === "user" ? "Cliente" : "Bot"} · {msg.time}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Manual intervention input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribí un mensaje para intervenir manualmente..."
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
            />
            <Button size="icon" className="shrink-0" disabled={!manualMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Los mensajes manuales se envían como el negocio, no como el bot.
          </p>
        </div>
      </div>
    </div>
  );
}
