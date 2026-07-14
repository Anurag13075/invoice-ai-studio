import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Uses browser Web Speech API for reliable, free, real-time transcription.
type SpeechRecognitionEvent = {
  results: { [k: number]: { [k: number]: { transcript: string }; isFinal: boolean; length: number }; length: number };
};
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

function getRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  return r;
}

export function VoiceAssistant() {
  const [rec, setRec] = useState(false);
  const [busy] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  const start = () => {
    const r = getRecognition();
    if (!r) { toast.error("Voice not supported in this browser. Use Chrome or Edge."); return; }
    recRef.current = r;
    setText("");
    setOpen(true);
    setRec(true);
    r.onresult = (e) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      setText(out);
    };
    r.onerror = (e) => { toast.error("Voice error", { description: e.error }); setRec(false); };
    r.onend = () => setRec(false);
    r.start();
  };
  const stop = () => { try { recRef.current?.stop(); } catch { /* noop */ } setRec(false); };

  return (
    <>
      <motion.button
        onClick={rec ? stop : start}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-40 size-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-black grid place-items-center shadow-xl shadow-emerald-500/30"
        aria-label="Voice assistant"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : rec ? <Square className="size-5" /> : <Mic className="size-5" />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-24 left-6 z-40 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{rec ? "Listening…" : "Transcript"}</div>
              <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="text-sm min-h-16 whitespace-pre-wrap">{text || "Say something…"}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
