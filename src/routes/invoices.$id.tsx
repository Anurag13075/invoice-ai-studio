import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, invoiceTotal, currency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Download, Printer, Send, Trash2, ArrowLeft, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { generateInvoicePdf } from "@/lib/pdf";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceStatus } from "@/lib/store";

export const Route = createFileRoute("/invoices/$id")({
  component: () => <AppShell><InvoiceView /></AppShell>,
});

function InvoiceView() {
  const { id } = Route.useParams();
  const invoice = useStore((s) => s.invoices.find((i) => i.id === id));
  const client = useStore((s) => s.clients.find((c) => c.id === invoice?.clientId));
  const settings = useStore((s) => s.settings);
  const updateInvoice = useStore((s) => s.updateInvoice);
  const del = useStore((s) => s.deleteInvoice);
  const addPayment = useStore((s) => s.addPayment);
  const push = useStore((s) => s.pushNotification);
  const navigate = useNavigate();

  if (!invoice) {
    return <div className="text-center py-16"><div className="text-lg font-semibold">Invoice not found</div><Link to="/invoices" className="text-sm text-muted-foreground">Back to invoices</Link></div>;
  }

  const total = invoiceTotal(invoice);

  const markPaid = () => {
    updateInvoice(invoice.id, { status: "paid", paidAmount: total });
    addPayment({ id: Math.random().toString(36).slice(2, 10), invoiceId: invoice.id, amount: total, method: "stripe", date: new Date().toISOString(), reference: "manual" });
    push({ title: "Payment received", message: `${invoice.number} was marked paid.`, type: "payment" });
    toast.success("Marked as paid");
  };

  return (
    <>
      <PageHeader
        title={invoice.number}
        subtitle={client?.company || "—"}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/invoices"><Button variant="ghost" size="sm" className="rounded-lg gap-1"><ArrowLeft className="size-4" />Back</Button></Link>
            <Select value={invoice.status} onValueChange={(v) => updateInvoice(invoice.id, { status: v as InvoiceStatus })}>
              <SelectTrigger className="w-32 bg-card border-border rounded-lg h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="rounded-lg gap-1" onClick={() => window.print()}><Printer className="size-4" />Print</Button>
            <Button variant="outline" size="sm" className="rounded-lg gap-1" onClick={() => {
              const doc = generateInvoicePdf(invoice, client, { name: settings.companyName, email: settings.companyEmail, address: settings.companyAddress });
              doc.save(`${invoice.number}.pdf`);
            }}><Download className="size-4" />PDF</Button>
            <Button variant="outline" size="sm" className="rounded-lg gap-1" onClick={() => { push({ title: "Invoice sent", message: `${invoice.number} emailed to ${client?.email || "client"}.`, type: "invoice" }); toast.success("Invoice sent"); }}><Send className="size-4" />Send</Button>
            {invoice.status !== "paid" && <Button size="sm" className="rounded-lg gap-1" onClick={markPaid}><DollarSign className="size-4" />Mark paid</Button>}
            <Button variant="ghost" size="sm" className="rounded-lg text-rose-400" onClick={() => { del(invoice.id); navigate({ to: "/invoices" }); }}><Trash2 className="size-4" /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-3xl font-bold tracking-tight">INVOICE</div>
              <div className="text-sm text-muted-foreground mt-1">{invoice.number}</div>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">From</div>
              <div className="font-semibold">{settings.companyName}</div>
              <div className="text-sm text-muted-foreground">{settings.companyAddress}</div>
              <div className="text-sm text-muted-foreground">{settings.companyEmail}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Bill to</div>
              <div className="font-semibold">{client?.company || "—"}</div>
              <div className="text-sm text-muted-foreground">{client?.address}</div>
              <div className="text-sm text-muted-foreground">{client?.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Issue date</div><div className="mt-1">{format(new Date(invoice.issueDate), "MMM d, yyyy")}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Due date</div><div className="mt-1">{format(new Date(invoice.dueDate), "MMM d, yyyy")}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</div><div className="mt-1 font-semibold">{currency(total, invoice.currency)}</div></div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => (
                <tr key={it.id} className="border-b border-border">
                  <td className="py-3">{it.description}</td>
                  <td className="py-3 text-right">{it.quantity}</td>
                  <td className="py-3 text-right">{currency(it.price, invoice.currency)}</td>
                  <td className="py-3 text-right">{currency(it.quantity * it.price * (1 + it.tax / 100), invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency(invoice.items.reduce((a, it) => a + it.quantity * it.price, 0), invoice.currency)}</span></div>
              {invoice.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{currency(invoice.discount, invoice.currency)}</span></div>}
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-base"><span>Total</span><span>{currency(total, invoice.currency)}</span></div>
            </div>
          </div>

          {invoice.notes && <div className="mt-8 text-sm text-muted-foreground italic border-t border-border pt-4">{invoice.notes}</div>}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-3">Details</div>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{currency(total, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd>{currency(invoice.paidAmount, invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Balance</dt><dd>{currency(Math.max(0, total - invoice.paidAmount), invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Currency</dt><dd>{invoice.currency}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
