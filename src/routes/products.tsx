import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, uid, currency, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Package, Star } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui-bits";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  component: () => <AppShell><Products /></AppShell>,
});

function emptyProduct(): Product {
  return { id: uid(), name: "", description: "", price: 0, tax: 0, sku: "", category: "", favorite: false, createdAt: new Date().toISOString() };
}

function Products() {
  const products = useStore((s) => s.products);
  const add = useStore((s) => s.addProduct);
  const update = useStore((s) => s.updateProduct);
  const del = useStore((s) => s.deleteProduct);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  return (
    <>
      <PageHeader title="Products & Services" subtitle={`${products.length} items`} actions={<Button onClick={() => { setEditing(emptyProduct()); setOpen(true); }} className="rounded-lg gap-2"><Plus className="size-4" />New item</Button>} />

      {products.length === 0 ? (
        <EmptyState icon={<Package className="size-6" />} title="No products yet" description="Add reusable line items to speed up invoicing." />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">SKU</th><th className="text-left px-4 py-3">Category</th><th className="text-right px-4 py-3">Price</th><th className="w-24"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => update(p.id, { favorite: !p.favorite })}><Star className={`size-4 ${p.favorite ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} /></button>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{currency(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="size-7 grid place-items-center rounded hover:bg-muted" onClick={() => { setEditing({ ...p }); setOpen(true); }}><Pencil className="size-3.5" /></button>
                      <button className="size-7 grid place-items-center rounded hover:bg-muted text-rose-400" onClick={() => { del(p.id); toast.success("Deleted"); }}><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>{editing && products.find((x) => x.id === editing.id) ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div><Label className="text-xs">Price</Label><Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: +e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div><Label className="text-xs">Tax %</Label><Input type="number" value={editing.tax} onChange={(e) => setEditing({ ...editing, tax: +e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div><Label className="text-xs">SKU</Label><Input value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div><Label className="text-xs">Category</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="bg-background border-border rounded-lg mt-1" /></div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="rounded-lg" onClick={() => {
                  if (!editing.name.trim()) return toast.error("Name required");
                  if (products.find((x) => x.id === editing.id)) update(editing.id, editing); else add(editing);
                  setOpen(false); toast.success("Saved");
                }}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
