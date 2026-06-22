import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wifi, LogOut, Plus, Pencil, Trash2, Users, DoorOpen, Search, QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RoomQrDialog } from "@/components/room-qr-dialog";
import { UniversalQrPanel } from "@/components/universal-qr-panel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — StayConnect" }] }),
  component: Admin,
});

type Room = {
  id: string;
  room_number: string;
  wifi_username: string;
  wifi_password: string;
  updated_at: string;
};

type Visitor = {
  id: string;
  name: string;
  phone: string;
  room_number: string;
  created_at: string;
};

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(Boolean(data));
    })();
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === false) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin privileges.
          </p>
          <Button onClick={signOut} variant="outline" className="mt-4">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-hero text-primary-foreground">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">StayConnect</p>
              <p className="text-xs text-muted-foreground">Admin dashboard</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Tabs defaultValue="rooms">
          <TabsList>
            <TabsTrigger value="rooms"><DoorOpen className="mr-2 h-4 w-4" />Rooms</TabsTrigger>
            <TabsTrigger value="qr"><QrCode className="mr-2 h-4 w-4" />Universal QR</TabsTrigger>
            <TabsTrigger value="visitors"><Users className="mr-2 h-4 w-4" />Visitor logs</TabsTrigger>
          </TabsList>
          <TabsContent value="rooms" className="mt-6">
            <RoomsPanel />
          </TabsContent>
          <TabsContent value="qr" className="mt-6">
            <UniversalQrPanel />
          </TabsContent>
          <TabsContent value="visitors" className="mt-6">
            <VisitorsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function RoomsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [filter, setFilter] = useState("");

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,room_number,wifi_username,wifi_password,updated_at")
        .order("room_number");
      if (error) throw error;
      return data as Room[];
    },
  });

  const filtered = rooms.filter((r) =>
    [r.room_number, r.wifi_username].some((v) => v.toLowerCase().includes(filter.toLowerCase())),
  );

  async function remove(id: string) {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Room deleted");
    qc.invalidateQueries({ queryKey: ["rooms"] });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Rooms & WiFi credentials</h2>
          <p className="text-sm text-muted-foreground">Manage room numbers and the WiFi info shared with guests.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 h-4 w-4" />Add room</Button>
            </DialogTrigger>
            <RoomDialog
              key={editing?.id ?? "new"}
              editing={editing}
              onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["rooms"] }); }}
            />
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room</TableHead>
            <TableHead>WiFi Username</TableHead>
            <TableHead>WiFi Password</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
          )}
          {!isLoading && filtered.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">
              No rooms yet. Click "Add room" to create one.
            </TableCell></TableRow>
          )}
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.room_number}</TableCell>
              <TableCell>{r.wifi_username}</TableCell>
              <TableCell className="font-mono text-sm">{r.wifi_password}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-1">
                  <RoomQrDialog roomNumber={r.room_number} />
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => { setEditing(r); setOpen(true); }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete room {r.room_number}?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RoomDialog({ editing, onDone }: { editing: Room | null; onDone: () => void }) {
  const [form, setForm] = useState({
    room_number: editing?.room_number ?? "",
    wifi_username: editing?.wifi_username ?? "",
    wifi_password: editing?.wifi_password ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      room_number: form.room_number.trim(),
      wifi_username: form.wifi_username.trim(),
      wifi_password: form.wifi_password,
    };
    const { error } = editing
      ? await supabase.from("rooms").update(payload).eq("id", editing.id)
      : await supabase.from("rooms").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Room updated" : "Room added");
    onDone();
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit room" : "Add room"}</DialogTitle>
        <DialogDescription>WiFi credentials are shown to any guest who registers with this room number.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room_number">Room number</Label>
          <Input id="room_number" required value={form.room_number} onChange={(e) => setForm((f) => ({ ...f, room_number: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wifi_username">WiFi username (SSID)</Label>
          <Input id="wifi_username" required value={form.wifi_username} onChange={(e) => setForm((f) => ({ ...f, wifi_username: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wifi_password">WiFi password</Label>
          <Input id="wifi_password" required value={form.wifi_password} onChange={(e) => setForm((f) => ({ ...f, wifi_password: e.target.value }))} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function VisitorsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitors")
        .select("id,name,phone,room_number,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Visitor[];
    },
  });

  const filtered = visitors.filter((v) =>
    [v.name, v.phone, v.room_number].some((x) => x.toLowerCase().includes(filter.toLowerCase())),
  );

  async function remove(id: string) {
    const { error } = await supabase.from("visitors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entry deleted");
    qc.invalidateQueries({ queryKey: ["visitors"] });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Visitor logs</h2>
          <p className="text-sm text-muted-foreground">Most recent registrations first. <Badge variant="secondary" className="ml-1">{visitors.length}</Badge></p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 w-56" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
          )}
          {!isLoading && filtered.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No visitors yet.</TableCell></TableRow>
          )}
          {filtered.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell>{v.phone}</TableCell>
              <TableCell><Badge variant="outline">{v.room_number}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(v.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                      <AlertDialogDescription>Visitor record for {v.name} will be removed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(v.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
