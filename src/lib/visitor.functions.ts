import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(30),
  roomNumber: z.string().trim().min(1).max(40),
});

export const registerVisitor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: room, error: roomErr } = await supabaseAdmin
      .from("rooms")
      .select("room_number, wifi_username, wifi_password")
      .eq("room_number", data.roomNumber)
      .maybeSingle();

    if (roomErr) throw new Error("Could not verify room. Try again.");
    if (!room) {
      return { ok: false as const, error: "Room number not found. Please check with reception." };
    }

    const { error: insErr } = await supabaseAdmin.from("visitors").insert({
      name: data.name,
      phone: data.phone,
      room_number: data.roomNumber,
    });
    if (insErr) throw new Error("Could not save your details. Try again.");

    return {
      ok: true as const,
      roomNumber: room.room_number,
      wifiUsername: room.wifi_username,
      wifiPassword: room.wifi_password,
    };
  });
