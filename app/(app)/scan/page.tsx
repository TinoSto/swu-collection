import { Suspense } from "react";
// Importiere hier deine bisherigen Komponenten/Logiken für die Startseite

export default function Page() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Meine Sammlung</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Lade Sammlung...</p>}>
        <CollectionContent />
      </Suspense>
    </section>
  );
}

async function CollectionContent() {
  // Verschiebe hierher den Code, der Supabase / Cookies / getOwnedCounts aufruft
  return (
    <div>
      {/* Deine Sammlungs-Ansicht */}
    </div>
  );
}