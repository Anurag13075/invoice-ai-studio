import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, change, icon, className, delay = 0 }: {
  label: string; value: ReactNode; change?: string; icon?: ReactNode; className?: string; delay?: number;
}) {
  const positive = change?.startsWith("+");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-2xl border border-border bg-card p-5 hover:border-border/80 transition-colors", className)}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {change && (
        <div className={cn("mt-1 text-xs", positive ? "text-emerald-400" : "text-rose-400")}>{change}</div>
      )}
    </motion.div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-16 text-center">
      <div className="mx-auto size-14 grid place-items-center rounded-2xl bg-muted/40 text-muted-foreground mb-4">{icon}</div>
      <div className="font-semibold text-lg">{title}</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}
