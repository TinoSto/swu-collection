import "server-only";
import type { OwnedCounts } from "@/lib/collection-types";
import type { UserCard } from "@/lib/supabase";
import { cardKey, type SwuCard } from "@/lib/swu-api";
import { createServerSupabase } from "@/lib/supabase-server-v2";

export async function getOwnedCounts(
  cards: Pick<SwuCard, "Set" | "Number">[]
): Promise<Map<string, OwnedCounts>> {
  const owned = new Map<string, OwnedCounts>();
  if (cards.length === 0) return owned;
  const sets = [...new Set(cards.map((c) => c.Set.toUpperCase()))];
  const numbers = [...new Set(cards.map((c) => c.Number))];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("user_cards")
    .select("set_code, card_number, count_normal, count_foil")
    .in("set_code", sets)
    .in("card_number", numbers);
  if (error) {
    throw new Error(`Sammlung konnte nicht geladen werden: ${error.message}`);
  }
  const rows = (data ?? []) as Pick<
    UserCard,
    "set_code" | "card_number" | "count_normal" | "count_foil"
  >[];
  for (const row of rows) {
    owned.set(cardKey(row.set_code, row.card_number), {
      normal: row.count_normal,
      foil: row.count_foil,
    });
  }
  return owned;
}

export function ownedFor(
  owned: Map<string, OwnedCounts>,
  card: Pick<SwuCard, "Set" | "Number">
): OwnedCounts {
  return owned.get(cardKey(card.Set, card.Number)) ?? { normal: 0, foil: 0 };
}