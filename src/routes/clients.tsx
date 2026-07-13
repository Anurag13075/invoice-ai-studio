import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, uid, currency, invoiceTotal } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search, Building2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui-bits";
import { toast } from "sonner";
import type { Client } from "@/lib/store";

export const Route = createFileRoute("/clients")({
  component: () => <AppShell><Clients /></AppShell>,
});

function emptyClient(): Client {
  return { id: uid(), company: "", contact: "", email: "", phone: "", address: "", vat: "", paymentTerms: 14, notes: "", tags: [], createdAt: new Date().toISOString() };
}

function Clients() {
  const clients = useStore((s) => s.clients);
  const invoices = useStore((s) => s.invoices);
  const add = useStore((s) => s.addClient);
  const update = useStore((s) => s.updateClient);
  const del = useStore((s) => s.deleteClient);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [q, setQ] = useState("");

  const filtered = clients.filter((c) => `${c.company} ${c.contact} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setEditing(emptyClient()); setOpen(true); };
  const openEdit = (c: Client) => { setEditing({ ...c }); setOpen(true); };
  const save = () => {
    if (!editing) return;
    if (!editing.company.trim()) return toast.error("Company name required");
    if (clients.find((x) => x.id === editing.id)) update(editing.id, editing);
    else add(editing);
    setOpen(false);
    toast.success("Client saved");
  };

  return (
    <>
      <PageHeader title="Clients" subtitle={`${clients.length} total`} actions={<Button onClick={openNew} className="rounded-lg gap-2"><Plus className="size-4" />New client</Button>} />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients..." className="pl-9 bg-card border-border rounded-lg h-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="size-6" />} title="No clients" description="Add a client to start sending invoices." action={<Button onClick={openNew} className="rounded-lg">Add client</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const clientInvoices = invoices.filter((i) => i.clientId === c.id);
            const total = clientInvoices.reduce((a, i) => a + invoiceTotal(i), 0);
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center font-semibold text-sm">
                    {c.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button className="size-7 grid place-items-center rounded hover:bg-muted" onClick={() => openEdit(c)}><Pencil className="size-3.5" /></button>
                    <button className="size-7 grid place-items-center rounded hover:bg-muted text-rose-400" onClick={() => { del(c.id); toast.success("Client deleted"); }}><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                <div className="font-semibold">{c.company}</div>
                <div className="text-sm text-muted-foreground">{c.contact}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.email}</div>
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-muted-foreground">Invoices</div><div className="font-medium">{clientInvoices.length}</div></div>
                  <div><div className="text-muted-foreground">Total billed</div><div className="font-medium">{currency(total)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="bg-card border-border rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>{editing && clients.find((x) => x.id === editing.id) ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company"><Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <Field label="Contact"><Input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <Field label="Email"><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <Field label="Phone"><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <div className="col-span-2"><Field label="Address"><Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="bg-background border-border rounded-lg" /></Field></div>
              <Field label="VAT / Tax ID"><Input value={editing.vat} onChange={(e) => setEditing({ ...editing, vat: e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <Field label="Payment terms (days)"><Input type="number" value={editing.paymentTerms} onChange={(e) => setEditing({ ...editing, paymentTerms: +e.target.value })} className="bg-background border-border rounded-lg" /></Field>
              <div className="col-span-2"><Field label="Notes"><Textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="bg-background border-border rounded-lg" /></Field></div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} className="rounded-lg">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1">{children}</div></div>;
}
