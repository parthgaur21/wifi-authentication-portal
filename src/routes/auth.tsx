import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin sign in — StayConnect" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 h-64 bg-hero" aria-hidden />
      <div className="relative mx-auto max-w-md px-5 pt-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-6 mb-6 text-center text-primary-foreground">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Access</h1>
          <p className="mt-1 text-sm opacity-90">Sign in to manage rooms and visitors.</p>
        </div>

        <Card className="p-6 shadow-glow">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-4 space-y-4">
                <Field label="Email" id="email-in" type="email" value={email} onChange={setEmail} />
                <Field label="Password" id="pw-in" type="password" value={password} onChange={setPassword} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-4 space-y-4">
                <Field label="Email" id="email-up" type="email" value={email} onChange={setEmail} />
                <Field label="Password" id="pw-up" type="password" value={password} onChange={setPassword} />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  The first account created becomes the admin automatically.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  type,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} required value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
