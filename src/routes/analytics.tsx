import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useStore, currency, invoiceTotal } from "@/lib/store";
import { StatCard } from "@/components/ui-bits";
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, isSameMonth, isAfter } from "date-fns";

export const Route = createFileRoute("/analytics")({
  component: () => <AppShell><Analytics /></AppShell>,
});

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"];

function Analytics() {
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const clients = useStore((s) => s.clients);
  const payments = useStore((s) => s.payments);

  const revenue = payments.reduce((a, p) => a + p.amount, 0);
  const spend = expenses.reduce((a, e) => a + e.amount, 0);
  const profit = revenue - spend;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
  const monthly = months.map((m) => {
    const rev = payments.filter((p) => isSameMonth(new Date(p.date), m)).reduce((a, p) => a + p.amount, 0);
    const exp = expenses.filter((e) => isSameMonth(new Date(e.date), m)).reduce((a, e) => a + e.amount, 0);
    return { name: format(m, "MMM"), revenue: rev, expenses: exp, profit: rev - exp };
  });

  const byClient = clients.map((c) => ({
    name: c.company,
    total: invoices.filter((i) => i.clientId === c.id).reduce((a, i) => a + invoiceTotal(i), 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5);

  const expensesByCat = Object.entries(expenses.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})).map(([name, value]) => ({ name, value }));

  const now = new Date();
  const aging = [
    { name: "Current", value: invoices.filter((i) => i.status !== "paid" && isAfter(new Date(i.dueDate), now)).reduce((a, i) => a + invoiceTotal(i) - i.paidAmount, 0) },
    { name: "1-30 days", value: invoices.filter((i) => i.status !== "paid" && !isAfter(new Date(i.dueDate), now)).reduce((a, i) => a + invoiceTotal(i) - i.paidAmount, 0) },
  ];

  return (
    <>
      <PageHeader title="Analytics" subtitle="Financial performance overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Revenue" value={currency(revenue)} icon={<DollarSign className="size-4" />} change="+12.4%" />
        <StatCard label="Expenses" value={currency(spend)} icon={<Receipt className="size-4" />} change="-3.1%" />
        <StatCard label="Profit" value={currency(profit)} icon={<TrendingUp className="size-4" />} change={`${margin.toFixed(1)}% margin`} />
        <StatCard label="Avg. Invoice" value={currency(invoices.length ? invoices.reduce((a, i) => a + invoiceTotal(i), 0) / invoices.length : 0)} icon={<TrendingDown className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Revenue vs Expenses</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0a0a0b", border: "1px solid #ffffff10", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#exp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Expenses by category</div>
          <div className="h-64">
            {expensesByCat.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCat} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                    {expensesByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a0a0b", border: "1px solid #ffffff10", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">No data</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Top clients</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClient} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={120} />
                <Tooltip contentStyle={{ background: "#0a0a0b", border: "1px solid #ffffff10", borderRadius: 8 }} />
                <Bar dataKey="total" fill="#22c55e" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">A/R Aging</div>
          <div className="space-y-3">
            {aging.map((a) => (
              <div key={a.name}>
                <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{a.name}</span><span className="font-medium">{currency(a.value)}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (a.value / (aging.reduce((s, x) => s + x.value, 0) || 1)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
