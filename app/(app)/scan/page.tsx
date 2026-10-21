import Link from "next/link";
import { Suspense } from "react";
import { FormMessage } from "@/components/AuthCard";
import { CardTile } from "@/components/CardTile";
import { SearchBar } from "@/components/SearchBar";
import { getOwnedCounts, ownedFor } from "@/lib/collection";
import { searchCards, getSetCards, SwuApiError, type SwuCard } from "@/lib/swu-api";

const MAX_RESULTS = 250; // Genug Platz, um ein ganzes Set anzuzeigen
type SearchParams = Promise<{ q?: string | string[]; set?: string | string[] }>;

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Karten suchen</h1>
      <Suspense fallback={<SearchBar defaultQuery="" defaultSet="" />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const selectedSet = typeof params.set === "string" ? params.set.trim().toUpperCase() : "";

  const hasFilter = query !== "" || selectedSet !== "";

  return (
    <>
      <SearchBar defaultQuery={query} defaultSet={selectedSet} />
      {hasFilter ? (
        <Suspense key={`${query}-${selectedSet}`} fallback={<ResultsSkeleton />}>
          <Results query={query} selectedSet={selectedSet} />
        </Suspense>
      ) : (
        <SearchHelp />
      )}
    </>
  );
}

async function Results({ query, selectedSet }: { query: string; selectedSet: string }) {
  let cards: SwuCard[] = [];
  try {
    if (!query && selectedSet) {
      // Nur Set ausgewählt: Alle Karten dieses Sets holen
      cards = await getSetCards(selectedSet);
    } else if (query && selectedSet) {
      // Set und Suchtext: Erst Text suchen, dann auf Set filtern
      const raw = await searchCards(query);
      cards = raw.filter((c) => c.Set.toUpperCase() === selectedSet);
    } else if (query) {
      // Nur Suchtext
      cards = await searchCards(query);
    }
  } catch (error) {
    const message =
      error instanceof SwuApiError
        ? error.message
        : "Die Suche ist fehlgeschlagen. Versuche es erneut.";
    return <FormMessage kind="error">{message}</FormMessage>;
  }

  if (cards.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Keine Karten gefunden für diese Auswahl.
      </p>
    );
  }

  const shown = cards.slice(0, MAX_RESULTS);
  let owned;
  try {
    owned = await getOwnedCounts(shown);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sammlung nicht verfügbar.";
    return <FormMessage kind="error">{message}</FormMessage>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
        {cards.length} {cards.length === 1 ? "Treffer" : "Treffer"}
        {cards.length > MAX_RESULTS && `, angezeigt werden die ersten ${MAX_RESULTS}.`}
      </p>
      <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((card) => (
          <li key={`${card.Set}-${card.Number}`}>
            <CardTile card={card} owned={ownedFor(owned, card)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-busy="true">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400" role="status">
        Suche läuft …
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="aspect-[5/9] rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}

function SearchHelp() {
  return (
    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
      <p>Wähle ein Set aus oder suche nach Kartenname:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Nur Set auswählen: Zeigt alle Karten dieses Sets an.</li>
        <li>Name: <code>vader</code></li>
        <li>Set und Nummer: <code>sor 10</code></li>
      </ul>
      <p>
        Karte vor dir? <Link href="/scan" className="underline underline-offset-2">Scannen</Link>
      </p>
    </div>
  );
}