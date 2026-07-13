import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, currency, invoiceTotal } from "@/lib/store";
import { EmptyState } from "@/components/ui-bits";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/payments")({
  component: () => <AppShell><Payments /></AppShell>,
});

function Payments() {
  const payments = useStore((s) => s.payments);
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);

  const total = payments.reduce((a, p) => a + p.amount, 0);
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((a, i) => a + invoiceTotal(i) - i.paidAmount, 0);

  return (
    <>
      <PageHeader title="Payments" subtitle={`${currency(total)} received · ${currency(outstanding)} outstanding`} />

      {payments.length === 0 ? (
        <EmptyState icon={<CreditCard className="size-6" />} title="No payments yet" description="Payments will appear here when invoices are marked paid." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr><th className="text-left px-4 py-3">Reference</th><th className="text-left px-4 py-3">Invoice</th><th className="text-left px-4 py-3">Client</th><th className="text-left px-4 py-3">Method</th><th className="text-left px-4 py-3">Date</th><th className="text-right px-4 py-3">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const inv = invoices.find((i) => i.id === p.invoiceId);
                const c = clients.find((x) => x.id === inv?.clientId);
                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3 font-medium">{inv?.number || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c?.company || "—"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 uppercase">{p.method}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(p.date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">+{currency(p.amount)}</td>
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
