import Image from "next/image";
import { searchByInput, getSetCards, cardImageUrl, cardTitle, getSets, type SwuCard, type SwuSet } from "@/lib/swu-api";
import { createServerSupabase } from "@/lib/supabase-server-v2";
import { adjustCardCountAction } from "./actions";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    set?: string;
    type?: string;
    aspect?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const setFilter = typeof params.set === "string" ? params.set : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const aspectFilter = typeof params.aspect === "string" ? params.aspect : "";

  // 1. Karten über SWU-DB API suchen
    let cards: SwuCard[] = [];
  try {
    if (query) {
      // Suchtext vorhanden: wie bisher suchen (Set-Filter greift danach in Schritt 3)
      cards = await searchByInput(query);
    } else if (setFilter) {
      // Set gewählt, Suchleiste leer: alle Karten des Sets laden
      cards = await getSetCards(setFilter);
    }
  } catch {
    cards = [];
  }

  // 2. Verfügbare Sets für das Filter-Dropdown laden
  let sets: SwuSet[] = [];
  try {
    sets = await getSets();
  } catch {
    sets = [];
  }

  // 3. Nach Set & Typ filtern
  if (setFilter) {
    cards = cards.filter((c) => c.Set.toUpperCase() === setFilter.toUpperCase());
  }
  if (typeFilter) {
    cards = cards.filter((c) => c.Type.toLowerCase() === typeFilter.toLowerCase());
  }
  if (aspectFilter) {
    cards = cards.filter((c) =>
      (c.Aspects ?? []).some((a) => a.toLowerCase() === aspectFilter.toLowerCase())
    );
  }

  // 4. Aktuelle Sammlung des Nutzers laden, um Bestände anzuzeigen
  const supabase = await createServerSupabase();
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("set_code, card_number, count_normal, count_foil");

  const collectionMap = new Map<string, { normal: number; foil: number }>();
  userCards?.forEach((uc) => {
    collectionMap.set(`${uc.set_code}-${uc.card_number}`, {
      normal: uc.count_normal,
      foil: uc.count_foil,
    });
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Karten suchen & hinzufügen</h1>

      {/* Such- & Filterformular */}
      <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Name oder Set/Nummer (z.B. sor 10, Vader)..."
          className="sm:col-span-2 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100"
        />

        {/* Set-Filter */}
        <select
          name="set"
          defaultValue={setFilter}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:bg-zinc-900"
        >
          <option value="">Alle Sets</option>
          {sets.map((s) => (
            <option key={s.setId} value={s.setId}>
              {s.setId} – {s.fullName}
            </option>
          ))}
        </select>

        {/* Typ-Filter */}
        <select
          name="type"
          defaultValue={typeFilter}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:bg-zinc-900"
        
        >
          <option value="">Alle Typen</option>
          <option value="Leader">Leader</option>
          <option value="Base">Base</option>
          <option value="Unit">Unit</option>
          <option value="Event">Event</option>
          <option value="Upgrade">Upgrade</option>
        </select>
        {/* Aspekt-Filter */}
        <select
          name="aspect"
          defaultValue={aspectFilter}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:bg-zinc-900"
        >
          <option value="">Alle Aspekte</option>
          <option value="Heroism">Heldentum</option>
          <option value="Villainy">Schurkentum</option>
          <option value="Vigilance">Wachsamkeit</option>
          <option value="Command">Befehl</option>
          <option value="Aggression">Aggression</option>
          <option value="Cunning">Gerissenheit</option>
        </select>

       <div className="sm:col-span-5 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Suchen / Filtern
          </button>
        </div>
      </form>

      {/* Ergebnis-Anzeige */}
      {(query || setFilter || typeFilter || aspectFilter) && (
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

              {/* Zähler & Steuerung */}
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-2">
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