import { cn } from "@/lib/utils";
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    overdue: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    draft: "bg-muted text-muted-foreground border-border",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    declined: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    expired: "bg-muted text-muted-foreground border-border",
  };
  return <span className={cn("px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider whitespace-nowrap", map[status] || map.draft)}>{status}</span>;
}
