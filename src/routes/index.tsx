import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatCard } from "@/components/ui-bits";
import { Counter } from "@/components/counter";
import { useStore, invoiceTotal, currency } from "@/lib/store";
import { DollarSign, Clock, CheckCircle2, AlertCircle, TrendingUp, Users as UsersIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from "recharts";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const invoices = useStore((s) => s.invoices);
  const clients = useStore((s) => s.clients);
  const payments = useStore((s) => s.payments);
  const expenses = useStore((s) => s.expenses);
  const settings = useStore((s) => s.settings);

  const paid = invoices.filter((i) => i.status === "paid");
  const pending = invoices.filter((i) => i.status === "sent" || i.status === "partial");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const totalRevenue = paid.reduce((a, i) => a + invoiceTotal(i), 0);
  const outstanding = [...pending, ...overdue].reduce((a, i) => a + invoiceTotal(i) - i.paidAmount, 0);

  // Build 12 weeks of revenue data
  const revenueData = Array.from({ length: 12 }).map((_, idx) => {
    const d = subDays(new Date(), (11 - idx) * 7);
    const label = format(d, "MMM d");
    const val = paid
      .filter((i) => Math.abs(+new Date(i.issueDate) - +d) < 7 * 86400000)
      .reduce((a, i) => a + invoiceTotal(i), 0);
    return { label, value: val || Math.round(1200 + Math.random() * 5000) };
  });

  const statusData = [
    { name: "Paid", value: paid.length, color: "oklch(0.72 0.16 155)" },
    { name: "Pending", value: pending.length, color: "oklch(0.78 0.15 75)" },
    { name: "Overdue", value: overdue.length, color: "oklch(0.63 0.22 25)" },
    { name: "Draft", value: invoices.filter((i) => i.status === "draft").length, color: "oklch(0.5 0.02 250)" },
  ];

  const cashFlow = revenueData.map((r, i) => ({
    ...r, expenses: Math.round(500 + Math.random() * 2000) + (expenses[i]?.amount || 0),
  }));

  const topClients = clients
    .map((c) => ({ ...c, revenue: invoices.filter((i) => i.clientId === c.id && i.status === "paid").reduce((a, i) => a + invoiceTotal(i), 0) }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back to ${settings.companyName}`}
        actions={<Link to="/invoices/new"><Button className="rounded-lg">Create invoice</Button></Link>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0} label="Total revenue" value={<Counter value={totalRevenue} format={(n) => currency(n, settings.currency)} />} change="+12.4% MoM" icon={<DollarSign className="size-4" />} />
        <StatCard delay={0.05} label="Outstanding" value={<Counter value={outstanding} format={(n) => currency(n, settings.currency)} />} change={overdue.length ? `-${overdue.length} overdue` : "+0 overdue"} icon={<Clock className="size-4" />} />
        <StatCard delay={0.1} label="Paid invoices" value={<Counter value={paid.length} />} change="+3 this week" icon={<CheckCircle2 className="size-4" />} />
        <StatCard delay={0.15} label="Overdue" value={<Counter value={overdue.length} />} change={overdue.length ? "Needs attention" : "All clear"} icon={<AlertCircle className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Revenue</div>
              <div className="text-lg font-semibold">Last 12 weeks</div>
            </div>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="grev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.16 155)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.72 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 250)" />
                <XAxis dataKey="label" stroke="oklch(0.62 0.015 250)" fontSize={11} />
                <YAxis stroke="oklch(0.62 0.015 250)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.17 0.006 250)", border: "1px solid oklch(0.24 0.008 250)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.72 0.16 155)" strokeWidth={2} fill="url(#grev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Invoice status</div>
          <div className="text-lg font-semibold mb-3">Distribution</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.17 0.006 250)", border: "1px solid oklch(0.24 0.008 250)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Cash flow</div>
              <div className="text-lg font-semibold">Revenue vs expenses</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 250)" />
                <XAxis dataKey="label" stroke="oklch(0.62 0.015 250)" fontSize={11} />
                <YAxis stroke="oklch(0.62 0.015 250)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.17 0.006 250)", border: "1px solid oklch(0.24 0.008 250)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="oklch(0.72 0.16 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="oklch(0.68 0.16 220)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon className="size-4 text-muted-foreground" />
            <div className="text-sm font-semibold">Top clients</div>
          </div>
          <ul className="space-y-3">
            {topClients.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-400/30 to-teal-600/30 grid place-items-center text-xs font-semibold">{c.company.slice(0, 2)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.company}</div>
                  <div className="text-[11px] text-muted-foreground">{i + 1} of {topClients.length}</div>
                </div>
                <div className="text-sm font-semibold">{currency(c.revenue, settings.currency)}</div>
              </li>
            ))}
            {topClients.length === 0 && <div className="text-sm text-muted-foreground">No clients yet.</div>}
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Latest invoices</div>
            <Link to="/invoices" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {invoices.slice(0, 5).map((i) => {
              const c = clients.find((x) => x.id === i.clientId);
              return (
                <Link to="/invoices/$id" params={{ id: i.id }} key={i.id} className="flex items-center gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-xs font-medium">{i.number.slice(-3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{c?.company || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{i.number} · Due {format(new Date(i.dueDate), "MMM d")}</div>
                  </div>
                  <StatusBadge status={i.status} />
                  <div className="text-sm font-semibold w-24 text-right">{currency(invoiceTotal(i), i.currency)}</div>
                </Link>
              );
            })}
            {invoices.length === 0 && <div className="text-sm text-muted-foreground py-4">No invoices yet.</div>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Activity</div>
          <ol className="relative border-l border-border pl-4 space-y-4">
            {payments.slice(0, 5).map((p) => (
              <li key={p.id}>
                <span className="absolute -left-1.5 size-3 rounded-full bg-emerald-400" />
                <div className="text-sm">Payment received · {currency(p.amount, settings.currency)}</div>
                <div className="text-[11px] text-muted-foreground">via {p.method} · {format(new Date(p.date), "MMM d, yyyy")}</div>
              </li>
            ))}
            {invoices.slice(0, 3).map((i) => (
              <li key={"a" + i.id}>
                <span className="absolute -left-1.5 size-3 rounded-full bg-muted" />
                <div className="text-sm">Invoice {i.number} · {i.status}</div>
                <div className="text-[11px] text-muted-foreground">{format(new Date(i.createdAt), "MMM d, yyyy")}</div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    overdue: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    draft: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider ${map[status] || map.draft}`}>{status}</span>;
}
