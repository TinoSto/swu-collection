"use client";

import { useState } from "react";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error(`Export fehlgeschlagen (HTTP ${res.status}).`);

      // Falls der Proxy auf die Login-Seite umleitet, kommt HTML statt CSV zurück
      const type = res.headers.get("content-type") ?? "";
      if (!type.includes("text/csv")) {
        throw new Error("Export fehlgeschlagen. Bitte neu einloggen.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `swu-sammlung-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "Exportiere..." : "Sammlung exportieren"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}