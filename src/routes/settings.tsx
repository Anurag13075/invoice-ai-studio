import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: () => <AppShell><Settings /></AppShell>,
});

function Settings() {
  const s = useStore((x) => x.settings);
  const update = useStore((x) => x.updateSettings);

  return (
    <>
      <PageHeader title="Settings" subtitle="Company details and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Company</div>
          <div className="space-y-3">
            <div><Label className="text-xs">Company name</Label><Input value={s.companyName} onChange={(e) => update({ companyName: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input value={s.companyEmail} onChange={(e) => update({ companyEmail: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Address</Label><Textarea rows={2} value={s.companyAddress} onChange={(e) => update({ companyAddress: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Invoicing</div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Currency</Label><Input value={s.currency} onChange={(e) => update({ currency: e.target.value.toUpperCase() })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Default tax %</Label><Input type="number" value={s.taxRate} onChange={(e) => update({ taxRate: +e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Invoice prefix</Label><Input value={s.invoicePrefix} onChange={(e) => update({ invoicePrefix: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Next number</Label><Input type="number" value={s.nextInvoiceNumber} onChange={(e) => update({ nextInvoiceNumber: +e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
          </div>
          <div className="mt-4"><Button className="rounded-lg" onClick={() => toast.success("Settings saved")}>Save changes</Button></div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-2">Data</div>
          <p className="text-xs text-muted-foreground mb-3">All data is stored in your browser (localStorage). Use these tools carefully.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => { const data = JSON.stringify(localStorage.getItem("lovable-invoice-saas-v1") || "{}"); const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "invoice-saas-backup.json"; a.click(); }}>Export data</Button>
            <Button variant="outline" className="rounded-lg text-rose-400" onClick={() => { if (confirm("Reset all data?")) { localStorage.removeItem("lovable-invoice-saas-v1"); window.location.reload(); } }}>Reset all data</Button>
          </div>
        </div>
      </div>
    </>
  );
}
