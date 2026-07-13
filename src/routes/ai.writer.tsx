import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/ai/writer")({
  component: () => <AppShell><Writer /></AppShell>,
});

const TEMPLATES = [
  { id: "reminder", label: "Payment Reminder", system: "You are a polite but firm business writer. Write concise payment reminder emails." },
  { id: "thanks", label: "Thank You Note", system: "Write warm client thank-you messages after payment." },
  { id: "proposal", label: "Project Proposal", system: "Write a concise project proposal outline with scope, timeline, and pricing sections." },
  { id: "followup", label: "Follow-up", system: "Write a friendly professional client follow-up email." },
  { id: "quote", label: "Quote Cover", system: "Write a cover message for a quote/estimate delivery." },
];

function Writer() {
  const [templateId, setTemplateId] = useState("reminder");
  const [tone, setTone] = useState("professional");
  const [brief, setBrief] = useState("Client: Acme Corp, Invoice: INV-1004, $1,500, 15 days overdue.");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!brief.trim()) return;
    setBusy(true); setOutput("");
    try {
      const template = TEMPLATES.find((t) => t.id === templateId)!;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `${template.system} Tone: ${tone}. Return markdown.` },
            { role: "user", content: brief },
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const d = j.choices?.[0]?.delta?.content;
            if (d) { acc += d; setOutput(acc); }
          } catch { /* noop */ }
        }
      }
    } catch (e) {
      toast.error("Generation failed", { description: (e as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="AI Business Writer" subtitle="Draft emails, reminders, proposals and more" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="bg-background border-border rounded-lg mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-background border-border rounded-lg mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="firm">Firm</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Brief</Label>
            <Textarea rows={8} value={brief} onChange={(e) => setBrief(e.target.value)} className="bg-background border-border rounded-lg mt-1" />
          </div>
          <Button onClick={generate} disabled={busy} className="w-full rounded-lg gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Write it
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Output</div>
            {output && <Button size="sm" variant="ghost" className="gap-1" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}><Copy className="size-3.5" />Copy</Button>}
          </div>
          <div className="prose prose-invert prose-sm max-w-none min-h-[300px]">
            {output ? <ReactMarkdown>{output}</ReactMarkdown> : <div className="text-sm text-muted-foreground">Your generated copy will appear here.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export { Input };
