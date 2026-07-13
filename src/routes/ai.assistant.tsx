import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useStore, invoiceTotal, currency } from "@/lib/store";

export const Route = createFileRoute("/ai/assistant")({
  component: () => <AppShell><Assistant /></AppShell>,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which invoices are overdue?",
  "Summarize my last month",
  "Write a payment reminder for INV-1004",
  "How much did I earn this quarter?",
];

function Assistant() {
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);
  const payments = useStore((s) => s.payments);
  const expenses = useStore((s) => s.expenses);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I'm your Ledger AI assistant. I can see your invoices, clients, payments and expenses. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const context = () => {
    const summary = {
      invoices: invoices.slice(0, 20).map((i) => {
        const c = clients.find((x) => x.id === i.clientId);
        return { number: i.number, client: c?.company, status: i.status, dueDate: i.dueDate, total: invoiceTotal(i) };
      }),
      totalRevenue: payments.reduce((a, p) => a + p.amount, 0),
      totalExpenses: expenses.reduce((a, e) => a + e.amount, 0),
      clientCount: clients.length,
      currency: currency(0).replace(/[\d.,]/g, "").trim() || "USD",
    };
    return `Current business snapshot (JSON):\n${JSON.stringify(summary, null, 2)}`;
  };

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `You are Ledger AI, an assistant embedded in an invoicing app. Be concise. Use markdown. ${context()}` },
            ...next.map(({ role, content }) => ({ role, content })),
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const d = j.choices?.[0]?.delta?.content;
            if (d) { acc += d; setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { role: "assistant", content: acc }; return copy; }); }
          } catch { /* noop */ }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Ask anything about your business — powered by Lovable AI" />
      <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <div className="size-8 rounded-lg bg-emerald-500/10 grid place-items-center flex-shrink-0"><Sparkles className="size-4 text-emerald-400" /></div>}
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/40"}`}>
                {m.content ? <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div> : <Loader2 className="size-4 animate-spin" />}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors">{s}</button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-4 flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask your assistant..."
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500/40"
            autoFocus
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()} className="rounded-lg gap-1"><Send className="size-4" />Send</Button>
        </div>
      </div>
    </>
  );
}
