import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wifi, Copy, Check, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { registerVisitor } from "@/lib/visitor.functions";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ room: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Guest WiFi Access — Sign in to connect" },
      { name: "description", content: "Scan, register, and get your WiFi credentials in seconds." },
      { property: "og:title", content: "Guest WiFi Access" },
      { property: "og:description", content: "Scan, register, and get your WiFi credentials in seconds." },
    ],
  }),
  component: Index,
});

type Creds = { roomNumber: string; wifiUsername: string; wifiPassword: string };

function Index() {
  const register = useServerFn(registerVisitor);
  const { room } = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [copied, setCopied] = useState<"u" | "p" | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", roomNumber: room ?? "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await register({ data: form });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCreds({
        roomNumber: res.roomNumber,
        wifiUsername: res.wifiUsername,
        wifiPassword: res.wifiPassword,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function copy(value: string, key: "u" | "p") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 1600);
    });
  }

  function reset() {
    setCreds(null);
    setForm({ name: "", phone: "", roomNumber: "" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-hero" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-primary-foreground">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Wifi className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">StayConnect</span>
        </div>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur hover:bg-white/25"
        >
          <ShieldCheck className="h-4 w-4" /> Admin
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-5 pt-6 pb-16">
        <div className="mb-8 text-center text-primary-foreground">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome aboard</h1>
          <p className="mt-2 text-sm opacity-90">
            Fill in a few details and we'll get you online instantly.
          </p>
        </div>

        <Card className="w-full shadow-glow">
          {!creds ? (
            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room number</Label>
                <Input
                  id="room"
                  required
                  maxLength={40}
                  value={form.roomNumber}
                  onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
                  placeholder="e.g. 204"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                <LogIn className="mr-2 h-4 w-4" />
                {submitting ? "Connecting…" : "Get WiFi access"}
              </Button>
            </form>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room {creds.roomNumber}</p>
                  <h2 className="text-lg font-semibold">You're all set</h2>
                </div>
              </div>

              <div className="space-y-3">
                <CredRow label="Network (SSID)" value={creds.wifiUsername} copied={copied === "u"} onCopy={() => copy(creds.wifiUsername, "u")} />
                <CredRow label="Password" value={creds.wifiPassword} copied={copied === "p"} onCopy={() => copy(creds.wifiPassword, "p")} mono />
              </div>

              <Button variant="outline" className="mt-6 w-full" onClick={reset}>
                Register another guest
              </Button>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-primary-foreground/80">
          Your details are kept private and only used for network access.
        </p>
      </main>
    </div>
  );
}

function CredRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`truncate text-base ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
      </div>
      <Button type="button" size="sm" variant={copied ? "secondary" : "default"} onClick={onCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="ml-1.5 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
