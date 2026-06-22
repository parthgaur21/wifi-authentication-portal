import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function RoomQrDialog({ roomNumber }: { roomNumber: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const link = `${window.location.origin}/?room=${encodeURIComponent(roomNumber)}`;
    setUrl(link);
    QRCode.toDataURL(link, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch((e) => toast.error(e instanceof Error ? e.message : "QR generation failed"));
  }, [open, roomNumber]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `room-${roomNumber}-wifi-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="QR code">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR code — Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Guests scan this to land on the registration page with the room pre-filled.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for room ${roomNumber}`}
              className="h-64 w-64 rounded-lg border bg-white p-2"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-muted" />
          )}
          <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
        </div>
        <DialogFooter>
          <Button onClick={download} disabled={!dataUrl}>
            <Download className="mr-2 h-4 w-4" /> Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
