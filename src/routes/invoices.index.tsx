import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, invoiceTotal, currency, type InvoiceStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui-bits";
import { FileText, Plus, Search, Download, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateInvoicePdf } from "@/lib/pdf";

export const Route = createFileRoute("/invoices/")({
  component: () => <AppShell><InvoicesList /></AppShell>,
});

function InvoicesList() {
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);
  const settings = useStore((s) => s.settings);
  const del = useStore((s) => s.deleteInvoice);
  const add = useStore((s) => s.addInvoice);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = invoices.filter((i) => {
    const c = clients.find((x) => x.id === i.clientId);
    const hay = `${i.number} ${c?.company || ""} ${c?.contact || ""}`.toLowerCase();
    return (status === "all" || i.status === status) && hay.includes(q.toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total · ${invoices.filter(i => i.status === "paid").length} paid`}
        actions={<Link to="/invoices/new"><Button className="rounded-lg gap-2"><Plus className="size-4" />New invoice</Button></Link>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices, clients..." className="pl-9 bg-card border-border rounded-lg h-10" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 bg-card border-border rounded-lg h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="No invoices yet"
          description="Create your first invoice — or let the AI draft one from a plain-English description."
          action={<Link to="/invoices/new"><Button className="rounded-lg">Create invoice</Button></Link>}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Issued</th>
                <th className="text-left px-4 py-3">Due</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((i) => {
                const c = clients.find((x) => x.id === i.clientId);
                return (
                  <tr key={i.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate({ to: "/invoices/$id", params: { id: i.id } })}>
                    <td className="px-4 py-3 font-medium">{i.number}</td>
                    <td className="px-4 py-3">{c?.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(i.issueDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(i.dueDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{currency(invoiceTotal(i), i.currency)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button className="size-7 grid place-items-center rounded hover:bg-muted" title="Download PDF" onClick={() => {
                          const doc = generateInvoicePdf(i, c, { name: settings.companyName, email: settings.companyEmail, address: settings.companyAddress });
                          doc.save(`${i.number}.pdf`);
                        }}><Download className="size-3.5" /></button>
                        <button className="size-7 grid place-items-center rounded hover:bg-muted" title="Duplicate" onClick={() => {
                          add({ ...i, id: Math.random().toString(36).slice(2, 10), number: `${settings.invoicePrefix}${settings.nextInvoiceNumber}`, status: "draft", paidAmount: 0, createdAt: new Date().toISOString() });
                          toast.success("Invoice duplicated");
                        }}><Copy className="size-3.5" /></button>
                        <button className="size-7 grid place-items-center rounded hover:bg-muted text-rose-400" title="Delete" onClick={() => { del(i.id); toast.success("Invoice deleted"); }}><Trash2 className="size-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

