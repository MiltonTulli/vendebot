"use client";

import { useState } from "react";
import {
  Search,
  Send,
  User,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  time: string;
}

interface Conversation {
  id: string;
  customer: string;
  phone: string;
  status: "active" | "escalated" | "closed";
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const statusConfig = {
  active: { label: "Activa", variant: "secondary" as const },
  escalated: { label: "Escalada", variant: "destructive" as const },
  closed: { label: "Cerrada", variant: "outline" as const },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

export function ConversationsClient({ conversations }: { conversations: Conversation[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(conversations[0] ?? null);
  const [manualMessage, setManualMessage] = useState("");

  const filtered = conversations.filter(
    (c) => !search || c.customer.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (conversations.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No hay conversaciones aún</p>
        <p className="text-sm">Las conversaciones aparecerán cuando los clientes escriban por WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 -m-6">
      <div className="flex w-80 shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={`flex w-full items-start gap-3 border-b p-3 text-left hover:bg-muted/50 transition-colors ${selected?.id === conv.id ? "bg-muted/70" : ""}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{conv.customer}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(conv.lastTime)}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {conv.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{conv.unread}</span>
                )}
                {conv.status === "escalated" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{selected.customer}</span>
                    <Badge variant={statusConfig[selected.status].variant}>{statusConfig[selected.status].label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.phone}</p>
                </div>
              </div>
              {selected.status === "escalated" && (
                <Button size="sm" variant="destructive"><Phone className="mr-2 h-3.5 w-3.5" />Tomar conversación</Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-start" : msg.role === "system" ? "justify-center" : "justify-end"}`}>
                  {msg.role === "system" ? (
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-300">{msg.content}</div>
                  ) : (
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                        {msg.role === "user" ? "Cliente" : "Bot"} · {msg.time}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea placeholder="Escribí un mensaje para intervenir manualmente..." className="min-h-[40px] max-h-[120px] resize-none" rows={1} value={manualMessage} onChange={(e) => setManualMessage(e.target.value)} />
                <Button size="icon" className="shrink-0" disabled={!manualMessage.trim()}><Send className="h-4 w-4" /></Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Los mensajes manuales se envían como el negocio, no como el bot.</p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">Seleccioná una conversación</div>
        )}
      </div>
    </div>
  );
}
