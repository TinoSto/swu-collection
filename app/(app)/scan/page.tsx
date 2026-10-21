export const dynamic = "force-dynamic";

import { ScanClient } from "@/components/ScanClient";

export default function ScanPage() {
  return (
    <section className="space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Karten-Scanner</h1>
      <ScanClient ownedMap={{}} />
    </section>
  );
}