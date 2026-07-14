import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, invoiceTotal, currency, uid, type LineItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, Sparkles, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export const Route = createFileRoute("/invoices/new")({
  component: () => <AppShell><NewInvoice /></AppShell>,
});

function NewInvoice() {
  const clients = useStore((s) => s.clients);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const addInvoice = useStore((s) => s.addInvoice);
  const navigate = useNavigate();

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [issueDate, setIssueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [items, setItems] = useState<LineItem[]>([{ id: uid(), description: "", quantity: 1, price: 0, tax: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState(settings.bankDetails || "");
  const [terms, setTerms] = useState(settings.defaultTerms || "");
  const [footer, setFooter] = useState(settings.defaultFooter || "");

  const total = invoiceTotal({ items, discount });
  const number = `${settings.invoicePrefix}${settings.nextInvoiceNumber}`;

  const update = (id: string, patch: Partial<LineItem>) => setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => setItems((s) => s.filter((x) => x.id !== id));

  const save = (status: "draft" | "sent") => {
    if (!clientId) return toast.error("Pick a client");
    const c = clients.find((x) => x.id === clientId);
    const inv = {
      id: uid(), number, clientId, status, issueDate, dueDate,
      items, discount, currency: settings.currency, notes, paidAmount: 0,
      createdAt: new Date().toISOString(),
      subject: subject || undefined,
      poNumber: poNumber || undefined,
      billTo: c ? { name: c.company, address: c.address, email: c.email, phone: c.phone, vat: c.vat } : undefined,
      shipTo: shipToName || shipToAddress ? { name: shipToName, address: shipToAddress } : undefined,
      paymentInstructions: paymentInstructions || undefined,
      terms: terms || undefined,
      footer: footer || undefined,
    };
    addInvoice(inv);
    toast.success(`Invoice ${number} ${status === "draft" ? "saved" : "sent"}`);
    navigate({ to: "/invoices/$id", params: { id: inv.id } });
  };

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const res = await fetch("/api/ai/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: aiPrompt }) });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items.map((it: { description: string; quantity: number; price: number }) => ({ id: uid(), description: it.description, quantity: it.quantity || 1, price: it.price || 0, tax: 0 })));
        if (data.notes) setNotes(data.notes);
        toast.success("AI generated line items");
      }
    } catch (e) {
      toast.error("AI failed", { description: (e as Error).message });
    } finally { setAiBusy(false); }
  };

  return (
    <>
      <PageHeader title="New invoice" subtitle={number} actions={
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg" onClick={() => save("draft")}>Save draft</Button>
          <Button className="rounded-lg" onClick={() => save("sent")}>Send invoice</Button>
        </div>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-emerald-400" />
              <div className="text-sm font-semibold">AI Invoice Generator</div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Describe your work in plain English and let AI draft the line items.</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. Built a 5-page website for a bakery, plus 3 months hosting" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="bg-background border-border rounded-lg" />
              <Button onClick={runAi} disabled={aiBusy || !aiPrompt.trim()} className="rounded-lg gap-2">
                {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate
              </Button>
            </div>
          </motion.div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-background border-border rounded-lg mt-1"><SelectValue placeholder="Pick client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Issue date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="bg-background border-border rounded-lg mt-1" />
              </div>
              <div>
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background border-border rounded-lg mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Subject / Project</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Q2 website redesign" className="bg-background border-border rounded-lg mt-1" />
              </div>
              <div>
                <Label className="text-xs">PO Number</Label>
                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-2026-0042" className="bg-background border-border rounded-lg mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ship to (name)</Label>
                <Input value={shipToName} onChange={(e) => setShipToName(e.target.value)} placeholder="Optional" className="bg-background border-border rounded-lg mt-1" />
              </div>
              <div>
                <Label className="text-xs">Ship to (address)</Label>
                <Input value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} placeholder="Optional" className="bg-background border-border rounded-lg mt-1" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Line items</div>
              <Button variant="ghost" size="sm" onClick={() => setItems((s) => [...s, { id: uid(), description: "", quantity: 1, price: 0, tax: 0 }])}><Plus className="size-4 mr-1" />Add item</Button>
            </div>
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-[1fr_80px_120px_80px_120px_40px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground px-2">
                <div>Description</div><div>Qty</div><div>Price</div><div>Tax %</div><div className="text-right">Total</div><div></div>
              </div>
              {items.map((it) => {
                const line = it.quantity * it.price * (1 + it.tax / 100);
                return (
                  <div key={it.id} className="grid grid-cols-1 md:grid-cols-[1fr_80px_120px_80px_120px_40px] gap-2 items-center">
                    <Input value={it.description} onChange={(e) => update(it.id, { description: e.target.value })} placeholder="Description" className="bg-background border-border rounded-lg" list="products" />
                    <Input type="number" value={it.quantity} onChange={(e) => update(it.id, { quantity: +e.target.value })} className="bg-background border-border rounded-lg" />
                    <Input type="number" value={it.price} onChange={(e) => update(it.id, { price: +e.target.value })} className="bg-background border-border rounded-lg" />
                    <Input type="number" value={it.tax} onChange={(e) => update(it.id, { tax: +e.target.value })} className="bg-background border-border rounded-lg" />
                    <div className="text-right font-medium">{currency(line, settings.currency)}</div>
                    <button className="size-8 rounded grid place-items-center hover:bg-muted text-rose-400" onClick={() => remove(it.id)}><Trash2 className="size-4" /></button>
                  </div>
                );
              })}
              <datalist id="products">{products.map((p) => <option key={p.id} value={p.name} />)}</datalist>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-background border-border rounded-lg" placeholder="Thank you for your business." />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div>
              <Label className="text-xs">Payment instructions / bank details</Label>
              <Textarea rows={4} value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} className="mt-1 bg-background border-border rounded-lg font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">Terms &amp; conditions</Label>
              <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} className="mt-1 bg-background border-border rounded-lg text-xs" />
            </div>
            <div>
              <Label className="text-xs">Footer</Label>
              <Input value={footer} onChange={(e) => setFooter(e.target.value)} className="mt-1 bg-background border-border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-24">
            <div className="text-sm font-semibold mb-4">Summary</div>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={currency(items.reduce((a, it) => a + it.quantity * it.price, 0), settings.currency)} />
              <Row label="Tax" value={currency(items.reduce((a, it) => a + (it.quantity * it.price * it.tax) / 100, 0), settings.currency)} />
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Discount</div>
                <Input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-28 h-8 bg-background border-border rounded-lg text-right" />
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <div className="font-semibold">Total</div>
                <div className="text-xl font-semibold">{currency(total, settings.currency)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><div className="text-muted-foreground">{label}</div><div>{value}</div></div>;
}
