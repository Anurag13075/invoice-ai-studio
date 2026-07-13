import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function VoiceAssistant() {
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setBusy(true);
        try {
          const fd = new FormData();
          const ext = (mr.mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
          fd.append("file", blob, `voice.${ext}`);
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) toast.success("Voice captured", { description: data.text });
          else toast.error("Transcription failed", { description: data.error || "Unknown error" });
        } catch (e) {
          toast.error("Transcription failed", { description: (e as Error).message });
        } finally {
          setBusy(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRec(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRec(false);
  };

  return (
    <motion.button
      onClick={rec ? stop : start}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-24 z-40 size-14 rounded-full bg-card border border-border shadow-2xl grid place-items-center text-foreground"
      aria-label="Voice assistant"
    >
      <AnimatePresence mode="wait" initial={false}>
        {busy
          ? <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="size-5 animate-spin" /></motion.span>
          : rec
            ? <motion.span key="s" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}><Square className="size-5 text-emerald-400" /></motion.span>
            : <motion.span key="m" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}><Mic className="size-5" /></motion.span>}
      </AnimatePresence>
      {rec && <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400 animate-ping" />}
    </motion.button>
  );
}
