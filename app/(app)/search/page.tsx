import Image from "next/image";
import { searchByInput, cardImageUrl, cardTitle, type SwuCard } from "@/lib/swu-api";
import { createServerSupabase } from "@/lib/supabase-server";
import { adjustCardCountAction } from "./actions";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  // Karten über API suchen
  let cards: SwuCard[] = [];
  if (query) {
    try {
      cards = await searchByInput(query);
    } catch {
      cards = [];
    }
  }

  // Aktuelle Sammlung des Nutzers laden, um Bestände anzuzeigen
  const supabase = await createServerSupabase();
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("set_code, card_number, count_normal, count_foil");

  // Als Map speichern für schnellen Zugriff: "SET-NUMBER" -> { normal, foil }
  const collectionMap = new Map<string, { normal: number; foil: number }>();
  userCards?.forEach((uc) => {
    collectionMap.set(`${uc.set_code}-${uc.card_number}`, {
      normal: uc.count_normal,
      foil: uc.count_foil,
    });
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Karten suchen</h1>

      {/* Suchformular */}
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Suche nach Name oder Set/Nummer (z.B. sor 10)..."
          className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:border-zinc-700 dark:focus-visible:border-zinc-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Suchen
        </button>
      </form>

      {/* Suchergebnisse */}
      {query && (
        <p className="text-sm text-zinc-500">
          {cards.length === 0
            ? "Keine Karten gefunden."
            : `${cards.length} Karte(n) gefunden:`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((card) => {
          const key = `${card.Set}-${card.Number}`;
          const counts = collectionMap.get(key) ?? { normal: 0, foil: 0 };
          const imgUrl = cardImageUrl(card.Set, card.Number);

          return (
            <div
              key={key}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={imgUrl}
                    alt={cardTitle(card)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <h2 className="font-medium text-sm">
                  {card.Set} #{card.Number} – {cardTitle(card)}
                </h2>
                <p className="text-xs text-zinc-500 capitalize">
                  Typ: {card.Type} | Seltenheit: {card.Rarity}
                </p>
              </div>

              {/* Zähler & Buttons für Sammlung */}
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-2">
                {/* Normal */}
                <div className="flex items-center justify-between text-sm">
                  <span>Normal: <strong>{counts.normal}</strong></span>
                  <div className="flex gap-1">
                    <form action={async () => { "use server"; await adjustCardCountAction(card.Set, card.Number, -1, 0); }}>
                      <button className="rounded bg-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700" disabled={counts.normal <= 0}>-</button>
                    </form>
                    <form action={async () => { "use server"; await adjustCardCountAction(card.Set, card.Number, 1, 0); }}>
                      <button className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">+</button>
                    </form>
                  </div>
                </div>

                {/* Foil */}
                <div className="flex items-center justify-between text-sm">
                  <span>Foil: <strong>{counts.foil}</strong></span>
                  <div className="flex gap-1">
                    <form action={async () => { "use server"; await adjustCardCountAction(card.Set, card.Number, 0, -1); }}>
                      <button className="rounded bg-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700" disabled={counts.foil <= 0}>-</button>
                    </form>
                    <form action={async () => { "use server"; await adjustCardCountAction(card.Set, card.Number, 0, 1); }}>
                      <button className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">+</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}