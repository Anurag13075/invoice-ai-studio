import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, currency, uid, type Expense } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui-bits";
import { toast } from "sonner";

export const Route = createFileRoute("/expenses")({
  component: () => <AppShell><Expenses /></AppShell>,
});

function Expenses() {
  const expenses = useStore((s) => s.expenses);
  const add = useStore((s) => s.addExpense);
  const del = useStore((s) => s.deleteExpense);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Expense>({ id: uid(), vendor: "", amount: 0, category: "Software", date: format(new Date(), "yyyy-MM-dd"), notes: "" });

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});

  return (
    <>
      <PageHeader title="Expenses" subtitle={`${currency(total)} total`} actions={<Button className="rounded-lg gap-2" onClick={() => { setF({ id: uid(), vendor: "", amount: 0, category: "Software", date: format(new Date(), "yyyy-MM-dd"), notes: "" }); setOpen(true); }}><Plus className="size-4" />New expense</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Object.entries(byCategory).map(([cat, sum]) => (
          <div key={cat} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{cat}</div>
            <div className="text-lg font-semibold mt-1">{currency(sum)}</div>
          </div>
        ))}
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={<Receipt className="size-6" />} title="No expenses" description="Track business expenses to improve reporting." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr><th className="text-left px-4 py-3">Vendor</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Date</th><th className="text-right px-4 py-3">Amount</th><th className="w-20"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{e.vendor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(e.date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-right font-semibold">{currency(e.amount)}</td>
                  <td className="px-4 py-3 text-right"><button className="size-7 grid place-items-center rounded hover:bg-muted text-rose-400 ml-auto" onClick={() => del(e.id)}><Trash2 className="size-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Vendor</Label><Input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Amount</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: +e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div><Label className="text-xs">Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div className="col-span-2"><Label className="text-xs">Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="rounded-lg" onClick={() => { if (!f.vendor) return toast.error("Vendor required"); add(f); setOpen(false); toast.success("Added"); }}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
