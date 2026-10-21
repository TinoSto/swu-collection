import Form from "next/form";
import { inputClass } from "@/components/AuthCard";
import { SubmitButton } from "@/components/SubmitButton";
import { getSets } from "@/lib/swu-api";

const SELECT_CLASS =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const SEARCH_BUTTON =
  "shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export async function SearchBar({ defaultQuery, defaultSet }: { defaultQuery: string; defaultSet: string }) {
  const sets = await getSets();

  return (
    <Form action="/search" role="search" className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="set" className="sr-only">
        Set auswählen
      </label>
      <select id="set" name="set" defaultValue={defaultSet} className={SELECT_CLASS}>
        <option value="">Alle Sets</option>
        {sets.map((s) => (
          <option key={s.setId} value={s.setId}>
            {s.setId} – {s.fullName}
          </option>
        ))}
      </select>

      <label htmlFor="q" className="sr-only">
        Kartensuche
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Name oder Nummer, z. B. vader oder 10"
        autoComplete="off"
        className={`${inputClass} min-w-0 flex-1`}
      />

      <SubmitButton pendingText="Suche …" className={SEARCH_BUTTON}>
        Suchen
      </SubmitButton>
    </Form>
  );
}