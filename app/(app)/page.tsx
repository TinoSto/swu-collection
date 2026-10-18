import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { getCard, cardImageUrl, cardTitle, type SwuCard } from "@/lib/swu-api";
import { adjustCardCountAction } from "./search/actions";

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    set?: string;
    type?: string;
    sort?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const searchFilter = (typeof params.q === "string" ? params.q : "").toLowerCase().trim();
  const setFilter = typeof params.set === "string" ? params.set : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const sortOption = typeof params.sort === "string" ? params.sort : "newest";

  const supabase = await createServerSupabase();

  // 1. Alle Karten des Nutzers laden
  const { data: userCards, error } = await supabase
    .from("user_cards")
    .select("set_code, card_number, count_normal, count_foil, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Deine Sammlung</h1>
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Fehler beim Laden der Datenbank: {error.message}
        </p>
      </section>
    );
  }

  // 2. API-Details laden
  const enrichedCards = await Promise.all(
    (userCards ?? []).map(async (uc) => {
      const details = await getCard(uc.set_code, uc.card_number);
      return {
        ...uc,
        details,
      };
    })
  );

  // Verfügbare Sets und Typen für die Filter-Dropdowns ermitteln
  const availableSets = Array.from(new Set(enrichedCards.map((c) => c.set_code))).sort();
  const availableTypes = Array.from(
    new Set(enrichedCards.map((c) => c.details?.Type).filter(Boolean))
  ).sort() as string[];

  // 3. Filtern (Name, Untertitel, Traits, Set, Typ)
  const filteredCards = enrichedCards.filter((card) => {
    // Set-Filter
    if (setFilter && card.set_code !== setFilter) return false;

    // Typ-Filter
    if (typeFilter && card.details?.Type !== typeFilter) return false;

    // Freitext- / Merkmal-Suche (Name, Subtitle, Traits, Aspects, Type)
    if (searchFilter) {
      const name = (card.details?.Name ?? "").toLowerCase();
      const subtitle = (card.details?.Subtitle ?? "").toLowerCase();
      const type = (card.details?.Type ?? "").toLowerCase();
      const traits = (card.details?.Traits ?? []).map((t) => t.toLowerCase());
      const aspects = (card.details?.Aspects ?? []).map((a) => a.toLowerCase());

      const matchesQuery =
        name.includes(searchFilter) ||
        subtitle.includes(searchFilter) ||
        type.includes(searchFilter) ||
        traits.some((t) => t.includes(searchFilter)) ||
        aspects.some((a) => a.includes(searchFilter));

      if (!matchesQuery) return false;
    }

    return true;
  });

  // 4. Sortieren
  filteredCards.sort((a, b) => {
    if (sortOption === "name") {
      const nameA = a.details ? cardTitle(a.details) : "";
      const nameB = b.details ? cardTitle(b.details) : "";
      return nameA.localeCompare(nameB);
    }
    if (sortOption === "count") {
      const countA = a.count_normal + a.count_foil;
      const countB = b.count_normal + b.count_foil;
      return countB - countA; // Absteigend
    }
    if (sortOption === "setnumber") {
      return a.card_number.localeCompare(b.card_number, undefined, { numeric: true });
    }
    // Standard: newest (Neueste zuerst)
    return 0;
  });

  // Gesamtsumme berechnen
  const totalCards = enrichedCards.reduce(
    (acc, curr) => acc + curr.count_normal + curr.count_foil,
    0
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deine Sammlung</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gesamt: <strong>{totalCards}</strong> Karte(n) in {enrichedCards.length} unterschiedlichen Ausführungen
          </p>
        </div>
        <Link
          href="/search"
          className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 text-center"
        >
          + Neue Karten suchen
        </Link>
      </div>

      {/* Filter- & Suchleiste */}
      <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {/* Freitext- / Merkmal-Suche */}
        <input
          type="text"
          name="q"
          defaultValue={searchFilter}
          placeholder="Name, Merkmal (z.B. Sith, Rebel)..."
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100"
        />

        {/* Set-Filter */}
        <select
          name="set"
          defaultValue={setFilter}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:bg-zinc-900"
        >
          <option value="">Alle Sets</option>
          {availableSets.map((s) => (
            <option key={s} value={s}>
              {s}
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
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Sortierung */}
        <select
          name="sort"
          defaultValue={sortOption}
          className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:focus-visible:border-zinc-100 dark:bg-zinc-900"
        >
          <option value="newest">Zuletzt hinzugefügt</option>
          <option value="name">Name (A-Z)</option>
          <option value="count">Höchste Anzahl</option>
          <option value="setnumber">Kartennummer</option>
        </select>

        <div className="sm:col-span-4 flex justify-end gap-2">
          {(searchFilter || setFilter || typeFilter || sortOption !== "newest") && (
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
            >
              Filter zurücksetzen
            </Link>
          )}
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Anwenden
          </button>
        </div>
      </form>

      {/* Ergebnis-Raster */}
      {filteredCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Keine Karten für diese Filtereinstellungen gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredCards.map((card) => {
            const key = `${card.set_code}-${card.card_number}`;
            const title = card.details ? cardTitle(card.details) : `${card.set_code} #${card.card_number}`;
            const imgUrl = cardImageUrl(card.set_code, card.card_number);

            return (
              <div
                key={key}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                    <Image
                      src={imgUrl}
                      alt={title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="font-medium text-sm">
                    {card.set_code} #{card.card_number} – {title}
                  </h2>
                  {card.details && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-zinc-500 capitalize">
                        Typ: {card.details.Type} | Seltenheit: {card.details.Rarity}
                      </p>
                      {card.details.Traits && card.details.Traits.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {card.details.Traits.map((trait) => (
                            <span
                              key={trait}
                              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Zähler & Steuerung in der Sammlung */}
                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Normal: <strong>{card.count_normal}</strong></span>
                    <div className="flex gap-1">
                      <form action={async () => { "use server"; await adjustCardCountAction(card.set_code, card.card_number, -1, 0); }}>
                        <button className="rounded bg-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700" disabled={card.count_normal <= 0}>-</button>
                      </form>
                      <form action={async () => { "use server"; await adjustCardCountAction(card.set_code, card.card_number, 1, 0); }}>
                        <button className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">+</button>
                      </form>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Foil: <strong>{card.count_foil}</strong></span>
                    <div className="flex gap-1">
                      <form action={async () => { "use server"; await adjustCardCountAction(card.set_code, card.card_number, 0, -1); }}>
                        <button className="rounded bg-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700" disabled={card.count_foil <= 0}>-</button>
                      </form>
                      <form action={async () => { "use server"; await adjustCardCountAction(card.set_code, card.card_number, 0, 1); }}>
                        <button className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">+</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}