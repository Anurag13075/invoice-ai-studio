import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useRef, useState } from "react";
import { Mic, Square, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/ai/voice")({
  component: () => <AppShell><Voice /></AppShell>,
});

function Voice() {
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
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
          const ext = (mr.mimeType || "").includes("mp4") ? "mp4" : "webm";
          fd.append("file", blob, `voice.${ext}`);
          const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) setTranscript((t) => [data.text, ...t]);
          else toast.error("Transcription failed", { description: data.error || "Unknown error" });
        } catch (e) { toast.error("Transcription failed", { description: (e as Error).message }); }
        finally { setBusy(false); }
      };
      mr.start(); mediaRef.current = mr; setRec(true);
    } catch { toast.error("Microphone permission denied"); }
  };

  const stop = () => { mediaRef.current?.stop(); setRec(false); };

  return (
    <>
      <PageHeader title="Voice Assistant" subtitle="Dictate invoice details, notes, or messages" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-8 grid place-items-center min-h-[400px]">
          <div className="text-center">
            <motion.button
              onClick={rec ? stop : start}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative size-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-400/30 grid place-items-center mx-auto"
            >
              {busy ? <Loader2 className="size-10 animate-spin" /> : rec ? <Square className="size-10 text-emerald-400" /> : <Mic className="size-10 text-emerald-400" />}
              {rec && <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400 animate-ping" />}
            </motion.button>
            <div className="mt-6 text-sm font-medium">{busy ? "Transcribing..." : rec ? "Recording — tap to stop" : "Tap to record"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Powered by OpenAI Whisper via Lovable AI</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="size-4 text-emerald-400" /><div className="text-sm font-semibold">Transcripts</div></div>
          {transcript.length === 0 ? (
            <div className="text-sm text-muted-foreground py-16 text-center">No transcripts yet. Record something to get started.</div>
          ) : (
            <div className="space-y-3">
              {transcript.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-muted/30 border border-border text-sm">{t}</motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
