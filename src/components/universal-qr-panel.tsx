import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const KEY = "universal_qr_url";

export function UniversalQrPanel() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      const initial = data?.value || `${window.location.origin}/`;
      setUrl(initial);
      setSaved(initial);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!saved) return;
    QRCode.toDataURL(saved, { width: 600, margin: 2, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch((e) => toast.error(e instanceof Error ? e.message : "QR generation failed"));
  }, [saved]);

  async function save() {
    const trimmed = url.trim();
    if (!trimmed) return toast.error("URL is required");
    try {
      new URL(trimmed);
    } catch {
      return toast.error("Enter a valid URL (including https://)");
    }
    setBusy(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: KEY, value: trimmed }, { onConflict: "key" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSaved(trimmed);
    toast.success("Universal QR updated");
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "universal-wifi-qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function useRegistrationUrl() {
    setUrl(`${window.location.origin}/`);
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Universal QR code</h2>
        <p className="text-sm text-muted-foreground">
          One QR that takes any guest to the registration page. Change the destination anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-url">Destination URL</Label>
            <Input
              id="qr-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-site.com/"
              disabled={loading}
            />
            <button
              type="button"
              onClick={useRegistrationUrl}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Use this site's registration page
            </button>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || loading || url.trim() === saved}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <Button variant="outline" onClick={download} disabled={!dataUrl}>
              <Download className="mr-2 h-4 w-4" /> Download PNG
            </Button>
          </div>
          {saved && (
            <p className="break-all rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Active: {saved}
            </p>
          )}
        </div>

        <div className="flex items-start justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Universal registration QR code"
              className="h-56 w-56 rounded-lg border bg-white p-2"
            />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded-lg bg-muted" />
          )}
        </div>
      </div>
    </Card>
  );
}
