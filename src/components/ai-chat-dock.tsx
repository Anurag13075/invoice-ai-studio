import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export function AiChatDock() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey — I'm your Ledger AI. Ask me to draft an invoice, summarize this month, or write a payment reminder." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-black shadow-2xl grid place-items-center"
        aria-label="Open AI"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="size-6" /></motion.span>
            : <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sparkles className="size-6" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center"><Sparkles className="size-4 text-black" /></div>
              <div>
                <div className="text-sm font-semibold">Ledger AI</div>
                <div className="text-[10px] text-muted-foreground">Online · powered by Lovable AI</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground",
                  )}>
                    {m.role === "assistant"
                      ? <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-2"><ReactMarkdown>{m.content || "…"}</ReactMarkdown></div>
                      : m.content}
                  </div>
                </div>
              ))}
              {busy && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start"><div className="rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Thinking…</div></div>
              )}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask anything…"
                  rows={1}
                  className="flex-1 resize-none rounded-xl bg-muted/40 border border-border px-3 py-2 text-sm outline-none focus:border-ring max-h-32"
                />
                <Button size="icon" onClick={send} disabled={busy || !input.trim()} className="rounded-xl">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
