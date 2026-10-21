"use server";

import { createServerSupabase } from "@/lib/supabase-server-v2";
import { revalidatePath } from "next/cache";

export async function adjustCardCountAction(
  setCode: string,
  cardNumber: string,
  deltaNormal: number,
  deltaFoil: number
) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("adjust_card_count", {
    p_set_code: setCode,
    p_card_number: cardNumber,
    p_delta_normal: deltaNormal,
    p_delta_foil: deltaFoil,
  });

  if (error) {
    console.error("Fehler beim Aktualisieren der Karte:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/search");
  revalidatePath("/");
}