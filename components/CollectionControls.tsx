"use client";

import { useRef, useState } from "react";
import type { OwnedCounts } from "@/lib/collection-types";
import { adjustCardCount } from "@/lib/collection-actions";

type Kind = "normal" | "foil";

const STEP_BUTTON =
  "flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-300 text-xl leading-none transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100";

export function CollectionControls({
  set,
  number,
  initial,
}: {
  set: string;
  number: string;
  initial: OwnedCounts;
}) {
  const [counts, setCounts] = useState<OwnedCounts>(initial);
  const [error, setError] = useState<string | null>(null);
  const confirmed = useRef<OwnedCounts>(initial);
  const inFlight = useRef(0);

  async function adjust(kind: Kind, delta: 1 | -1) {
    setError(null);
    setCounts((c) => ({ ...c, [kind]: Math.max(0, c[kind] + delta) }));
    inFlight.current += 1;
    let failure: string | null = null;
    try {
      const result = await adjustCardCount({
        set,
        number,
        deltaNormal: kind === "normal" ? delta : 0,
        deltaFoil: kind === "foil" ? delta : 0,
      });
      if (result.ok) {
        confirmed.current = { normal: result.normal, foil: result.foil };
      } else {
        failure = result.error;
      }
    } catch {
      failure = "Verbindung fehlgeschlagen.";
    }
    inFlight.current -= 1;
    if (failure) setError(failure);
    if (inFlight.current === 0) setCounts(confirmed.current);
  }

  return (
    <div className="space-y-3">
      <Stepper
        label="Normal"
        value={counts.normal}
        onMinus={() => void adjust("normal", -1)}
        onPlus={() => void adjust("normal", 1)}
      />
      <Stepper
        label="Foil"
        value={counts.foil}
        onMinus={() => void adjust("foil", -1)}
        onPlus={() => void adjust("foil", 1)}
      />
      {error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onMinus}
          disabled={value === 0}
          className={STEP_BUTTON}
          aria-label={`${label} entfernen`}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="min-w-8 text-center text-lg font-semibold tabular-nums"
        >
          {value}
        </output>
        <button
          type="button"
          onClick={onPlus}
          className={STEP_BUTTON}
          aria-label={`${label} hinzufügen`}
        >
          +
        </button>
      </div>
    </div>
  );
}