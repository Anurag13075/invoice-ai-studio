import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — signing you in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Auth failed", { description: (err as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <div className="dark min-h-screen grid place-items-center bg-background text-foreground p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center text-black font-bold">L</div>
          <div>
            <div className="text-base font-semibold">Ledger</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Invoice OS</div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground mb-6">{mode === "signin" ? "Sign in to your workspace" : "Start invoicing in seconds"}</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-background border-border rounded-lg" placeholder="you@company.com" autoComplete="email" />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-background border-border rounded-lg" placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-lg gap-2 mt-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button className="text-emerald-400 hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
