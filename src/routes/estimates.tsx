import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { FileCheck2 } from "lucide-react";
import { useStore, currency } from "@/lib/store";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/estimates")({
  component: () => <AppShell><Estimates /></AppShell>,
});

function Estimates() {
  const estimates = useStore((s) => s.estimates);
  const clients = useStore((s) => s.clients);

  return (
    <>
      <PageHeader title="Estimates & Quotes" subtitle="Send proposals that convert to invoices" />
      {estimates.length === 0 ? (
        <EmptyState icon={<FileCheck2 className="size-6" />} title="No estimates yet" description="Draft an estimate and share it with a client — approved estimates convert to invoices." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="text-left px-4 py-3">#</th><th className="text-left px-4 py-3">Client</th><th className="text-left px-4 py-3">Expires</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Amount</th></tr></thead>
            <tbody className="divide-y divide-border">
              {estimates.map((e) => {
                const c = clients.find((x) => x.id === e.clientId);
                const total = e.items.reduce((a, it) => a + it.quantity * it.price, 0) - (e.discount || 0);
                return (
                  <tr key={e.id}><td className="px-4 py-3 font-medium">{e.number}</td><td className="px-4 py-3">{c?.company || "—"}</td><td className="px-4 py-3 text-muted-foreground">{format(new Date(e.expiresAt), "MMM d, yyyy")}</td><td className="px-4 py-3"><StatusBadge status={e.status} /></td><td className="px-4 py-3 text-right font-semibold">{currency(total, e.currency)}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
