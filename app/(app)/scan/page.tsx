import { Suspense } from "react";
import { ScanClient } from "@/components/ScanClient";

export default function ScanPage() {
  return (
    <section className="space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Karten-Scanner</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Lade Scanner...</p>}>
        <ScanClient ownedMap={{}} />
      </Suspense>
    </section>
  );
}