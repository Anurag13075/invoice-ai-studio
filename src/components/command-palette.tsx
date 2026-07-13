import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Users, Package, BarChart3, Wallet, Receipt, Sparkles, Image as ImageIcon, Mic, Plus, Settings, Repeat, FileCheck2, LayoutDashboard } from "lucide-react";
import { useStore } from "@/lib/store";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);

  const go = (to: string) => { onOpenChange(false); navigate({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/invoices/new")}><Plus className="mr-2 size-4" />New invoice</CommandItem>
          <CommandItem onSelect={() => go("/clients")}><Plus className="mr-2 size-4" />Add client</CommandItem>
          <CommandItem onSelect={() => go("/ai/assistant")}><Sparkles className="mr-2 size-4" />Open AI Assistant</CommandItem>
          <CommandItem onSelect={() => go("/ai/image")}><ImageIcon className="mr-2 size-4" />Generate image</CommandItem>
          <CommandItem onSelect={() => go("/ai/voice")}><Mic className="mr-2 size-4" />Voice assistant</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="mr-2 size-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/invoices")}><FileText className="mr-2 size-4" />Invoices</CommandItem>
          <CommandItem onSelect={() => go("/clients")}><Users className="mr-2 size-4" />Clients</CommandItem>
          <CommandItem onSelect={() => go("/products")}><Package className="mr-2 size-4" />Products</CommandItem>
          <CommandItem onSelect={() => go("/recurring")}><Repeat className="mr-2 size-4" />Recurring</CommandItem>
          <CommandItem onSelect={() => go("/estimates")}><FileCheck2 className="mr-2 size-4" />Estimates</CommandItem>
          <CommandItem onSelect={() => go("/payments")}><Wallet className="mr-2 size-4" />Payments</CommandItem>
          <CommandItem onSelect={() => go("/expenses")}><Receipt className="mr-2 size-4" />Expenses</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}><BarChart3 className="mr-2 size-4" />Analytics</CommandItem>
          <CommandItem onSelect={() => go("/settings")}><Settings className="mr-2 size-4" />Settings</CommandItem>
        </CommandGroup>
        {invoices.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Invoices">
              {invoices.slice(0, 6).map((i) => (
                <CommandItem key={i.id} onSelect={() => go(`/invoices/${i.id}`)}>
                  <FileText className="mr-2 size-4" />{i.number} — {clients.find((c) => c.id === i.clientId)?.company || "—"}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {clients.slice(0, 6).map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/clients`)}>
                  <Users className="mr-2 size-4" />{c.company}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
