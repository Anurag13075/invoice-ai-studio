import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/ui-bits";
import { Repeat } from "lucide-react";
import { useStore, currency } from "@/lib/store";
import { format } from "date-fns";

export const Route = createFileRoute("/recurring")({
  component: () => <AppShell><Recurring /></AppShell>,
});

function Recurring() {
  const recurring = useStore((s) => s.recurring);
  const clients = useStore((s) => s.clients);

  return (
    <>
      <PageHeader title="Recurring invoices" subtitle="Automate repeating client billing" />
      {recurring.length === 0 ? (
        <EmptyState icon={<Repeat className="size-6" />} title="No recurring invoices" description="Set up templates that automatically generate invoices on a schedule." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="text-left px-4 py-3">Client</th><th className="text-left px-4 py-3">Frequency</th><th className="text-left px-4 py-3">Next</th><th className="text-right px-4 py-3">Amount</th></tr></thead>
            <tbody className="divide-y divide-border">
              {recurring.map((r) => {
                const c = clients.find((x) => x.id === r.clientId);
                const total = r.items.reduce((a, i) => a + i.quantity * i.price, 0);
                return (
                  <tr key={r.id}><td className="px-4 py-3">{c?.company || "—"}</td><td className="px-4 py-3 capitalize">{r.frequency}</td><td className="px-4 py-3 text-muted-foreground">{format(new Date(r.nextDate), "MMM d, yyyy")}</td><td className="px-4 py-3 text-right font-semibold">{currency(total, r.currency)}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
