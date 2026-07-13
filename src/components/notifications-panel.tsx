import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

export function NotificationsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markAllRead);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] bg-background border-l border-border">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto pr-1">
          {items.length === 0 && (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <Bell className="mx-auto size-8 mb-3 opacity-50" />
              You're all caught up.
            </div>
          )}
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card/70 p-3">
              <div className="flex items-center gap-2">
                {!n.read && <span className="size-1.5 rounded-full bg-emerald-400" />}
                <div className="text-sm font-medium">{n.title}</div>
                <div className="ml-auto text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
