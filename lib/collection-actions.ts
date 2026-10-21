"use server";

import { revalidatePath } from "next/cache";
import type { UserCard } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server-v2";

export type AdjustResult =
  | { ok: true; normal: number; foil: number }
  | { ok: false; error: string };

const SET_RE = /^[A-Za-z0-9]{2,8}$/;
const NUMBER_RE = /^[A-Za-z0-9-]{1,12}$/;

function isDelta(value: unknown): value is -1 | 0 | 1 {
  return value === -1 || value === 0 || value === 1;
}

export async function adjustCardCount(input: {
  set: string;
  number: string;
  deltaNormal: number;
  deltaFoil: number;
}): Promise<AdjustResult> {
  const { set, number, deltaNormal, deltaFoil } = input ?? {};
  if (
    typeof set !== "string" ||
    typeof number !== "string" ||
    !SET_RE.test(set) ||
    !NUMBER_RE.test(number) ||
    !isDelta(deltaNormal) ||
    !isDelta(deltaFoil) ||
    (deltaNormal === 0 && deltaFoil === 0)
  ) {
    return { ok: false, error: "Ungültige Eingabe." };
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("adjust_card_count", {
    p_set_code: set.toUpperCase(),
    p_card_number: number,
    p_delta_normal: deltaNormal,
    p_delta_foil: deltaFoil,
  });
  if (error) {
    const sessionLost =
      error.code === "42501" || error.message.includes("not authenticated");
    return {
      ok: false,
      error: sessionLost
        ? "Sitzung abgelaufen. Bitte neu anmelden."
        : "Die Sammlung konnte nicht aktualisiert werden.",
    };
  }
  const row = (Array.isArray(data) ? data[0] : data) as UserCard | null | undefined;
  if (!row) {
    return { ok: false, error: "Die Sammlung konnte nicht aktualisiert werden." };
  }
  revalidatePath("/");
  return { ok: true, normal: row.count_normal, foil: row.count_foil };
}