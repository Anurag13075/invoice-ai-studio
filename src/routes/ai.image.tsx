import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useStore, uid } from "@/lib/store";
import { motion } from "framer-motion";

export const Route = createFileRoute("/ai/image")({
  component: () => <AppShell><ImageStudio /></AppShell>,
});

const PRESETS = [
  { label: "Invoice Header", prompt: "Modern minimalist invoice header banner, soft gradient background, professional business aesthetic" },
  { label: "Business Card", prompt: "Elegant business card design, dark theme, gold accents, minimalist typography" },
  { label: "Social Post", prompt: "Instagram square post announcing a business milestone, clean modern design" },
  { label: "Logo Concept", prompt: "Abstract modern logo mark for a fintech startup, geometric, teal and emerald palette" },
  { label: "Email Banner", prompt: "Wide email header banner, subtle gradient, welcoming tone, business professional" },
  { label: "Product Mockup", prompt: "Elegant product mockup on marble surface, soft studio lighting, editorial style" },
];

function ImageStudio() {
  const images = useStore((s) => s.aiImages);
  const addImage = useStore((s) => s.addAiImage);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!data.image) throw new Error("No image returned");
      addImage({ id: uid(), url: data.image, prompt, createdAt: new Date().toISOString() });
      toast.success("Image generated");
    } catch (e) {
      toast.error("Generation failed", { description: (e as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="AI Image Studio" subtitle="Generate marketing visuals, headers, logos and more" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Label className="text-xs">Prompt</Label>
            <Textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="A minimalist banner for a Q3 financial report..." className="bg-background border-border rounded-lg mt-1" />
            <Button onClick={generate} disabled={busy || !prompt.trim()} className="w-full rounded-lg mt-3 gap-2">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate image
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick presets</div>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => setPrompt(p.prompt)} className="text-left px-3 py-2 rounded-lg border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-sm">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 min-h-[500px]">
            <div className="text-sm font-semibold mb-4">Gallery ({images.length})</div>
            {images.length === 0 ? (
              <div className="h-96 grid place-items-center text-center">
                <div>
                  <div className="size-16 rounded-full bg-emerald-500/10 grid place-items-center mx-auto mb-3"><Sparkles className="size-6 text-emerald-400" /></div>
                  <div className="font-medium">No images yet</div>
                  <div className="text-sm text-muted-foreground mt-1">Describe an image or pick a preset.</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((img) => (
                  <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group rounded-xl overflow-hidden border border-border bg-background">
                    <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(img.prompt); toast.success("Prompt copied"); }}><Copy className="size-3" />Prompt</Button>
                        <a href={img.url} download={`ai-image-${img.id}.png`}><Button size="sm" variant="ghost" className="h-7 text-xs gap-1"><Download className="size-3" />Download</Button></a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export { Input };
