import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Sparkles, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ai/voice")({
  component: () => <AppShell><Voice /></AppShell>,
});

type Rec = { continuous: boolean; interimResults: boolean; lang: string; onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string }; isFinal: boolean }; length: number } }) => void; onerror: (e: { error: string }) => void; onend: () => void; start: () => void; stop: () => void; };

function Voice() {
  const [rec, setRec] = useState(false);
  const [text, setText] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const ref = useRef<Rec | null>(null);
  const supported = typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  useEffect(() => () => { try { ref.current?.stop(); } catch { /* noop */ } }, []);

  const start = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { toast.error("Web Speech not supported. Use Chrome or Edge."); return; }
    const r = new Ctor();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    setText("");
    r.onresult = (e) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      setText(out);
    };
    r.onerror = (e) => { toast.error("Voice error", { description: e.error }); setRec(false); };
    r.onend = () => { setRec(false); setText((t) => { if (t.trim()) setHistory((h) => [t.trim(), ...h]); return t; }); };
    ref.current = r; r.start(); setRec(true);
  };
  const stop = () => { try { ref.current?.stop(); } catch { /* noop */ } setRec(false); };

  return (
    <>
      <PageHeader title="Voice Assistant" subtitle="Real-time speech-to-text in your browser" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-8 grid place-items-center min-h-[400px]">
          <div className="text-center">
            <motion.button
              onClick={rec ? stop : start}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative size-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-400/30 grid place-items-center mx-auto"
              disabled={!supported}
            >
              {rec ? <Square className="size-10 text-emerald-400" /> : <Mic className="size-10 text-emerald-400" />}
              {rec && <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400 animate-ping" />}
            </motion.button>
            <div className="mt-6 text-sm font-medium">{rec ? "Listening — tap to stop" : "Tap to speak"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{supported ? "Browser Web Speech API" : "Not supported — try Chrome or Edge"}</div>
            {text && <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border text-sm text-left max-w-md whitespace-pre-wrap">{text}</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="size-4 text-emerald-400" /><div className="text-sm font-semibold">Transcripts</div></div>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground py-16 text-center">No transcripts yet. Record something to get started.</div>
          ) : (
            <div className="space-y-3">
              {history.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-muted/30 border border-border text-sm">
                  <div className="whitespace-pre-wrap">{t}</div>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(t); toast.success("Copied"); }}><Copy className="size-3" />Copy</Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
