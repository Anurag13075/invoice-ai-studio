import { motion } from "framer-motion";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Users, Package, Repeat, FileCheck2, Wallet,
  Receipt, Sparkles, Image as ImageIcon, Mic, BarChart3, Settings as SettingsIcon,
  Bell, Search, Plus, LogOut, Loader2,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { NotificationsPanel } from "@/components/notifications-panel";
import { AiChatDock } from "@/components/ai-chat-dock";
import { VoiceAssistant } from "@/components/voice-assistant";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/estimates", label: "Estimates", icon: FileCheck2 },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const aiNav = [
  { to: "/ai/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/ai/image", label: "AI Image Studio", icon: ImageIcon },
  { to: "/ai/writer", label: "AI Writer", icon: FileText },
  { to: "/ai/voice", label: "Voice Assistant", icon: Mic },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const seed = useStore((s) => s.seed);

  useEffect(() => { seed(); }, [seed]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session;
      if (!s) { navigate({ to: "/auth" }); setAuthed(false); }
      else { setAuthed(true); setEmail(s.user.email ?? ""); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setAuthed(false); navigate({ to: "/auth" }); }
      else { setAuthed(true); setEmail(session.user.email ?? ""); }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="dark min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center text-black font-bold">L</div>
          <div>
            <div className="text-sm font-semibold text-sidebar-primary-foreground/95">Ledger</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Invoice OS</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            <div className="px-2 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Workspace</div>
            <ul className="space-y-0.5">
              {nav.map((n) => {
                const active = pathname === n.to;
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {active && (
                        <motion.span layoutId="sb-active" className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-400" />
                      )}
                      <n.icon className="size-4" />
                      <span>{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="px-2 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">AI</div>
            <ul className="space-y-0.5">
              {aiNav.map((n) => {
                const active = pathname === n.to;
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <n.icon className="size-4" />
                      <span>{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link to="/settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", pathname === "/settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60")}>
            <SettingsIcon className="size-4" /> Settings
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/70 bg-background/70 backdrop-blur sticky top-0 z-30">
          <div className="h-full px-4 md:px-6 flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="group flex-1 max-w-xl flex items-center gap-3 rounded-xl border border-border bg-card/60 hover:bg-card px-3.5 py-2 text-sm text-muted-foreground transition-colors"
            >
              <Search className="size-4" />
              <span>Search invoices, clients, actions...</span>
              <kbd className="ml-auto rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/invoices/new">
                <Button size="sm" className="rounded-lg gap-2"><Plus className="size-4" />New invoice</Button>
              </Link>
              <button
                onClick={() => setNotifOpen(true)}
                className="relative size-9 grid place-items-center rounded-lg border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unread > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-400" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
      <AiChatDock />
      <VoiceAssistant />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
