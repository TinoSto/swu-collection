"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { recognizeCanvas } from "@/lib/ocr-engine";
import { buildCameraPasses, buildUploadPasses, loadImageSource } from "@/lib/ocr-image";
import { resolveScanRawText } from "@/lib/scan-actions";
import { CardTile } from "@/components/CardTile";
import type { OwnedCounts } from "@/lib/collection-types";
import type { SwuCard } from "@/lib/swu-api";

export function ScanClient({ ownedMap }: { ownedMap: Record<string, OwnedCounts> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [foundCard, setFoundCard] = useState<{ card: SwuCard; owned: OwnedCounts } | null>(null);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => setStatusTest("Kamera nicht verfügbar. Nutze Datei-Upload."));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScan = useCallback(async () => {
    if (!videoRef.current) return;
    setScanning(true);
    setStatusText("Analysiere Bild...");
    try {
      const video = videoRef.current;
      const region = {
        x: video.videoWidth * 0.1,
        y: video.videoHeight * 0.7,
        width: video.videoWidth * 0.8,
        height: video.videoHeight * 0.25,
      };
      const passes = buildCameraPasses(video, region);

      let cardFound = false;
      for (const pass of passes) {
        const text = await recognizeCanvas(pass.canvas);
        const res = await resolveScanRawText(text);
        if (res.success && res.card) {
          const key = `${res.card.Set}-${res.card.Number}`.toUpperCase();
          setFoundCard({ card: res.card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
          cardFound = true;
          break;
        }
      }
      if (!cardFound) {
        setStatusText("Keine Karte erkannt. Versuche es erneut.");
      }
    } catch {
      setStatusText("Fehler beim Scannen.");
    } finally {
      setScanning(false);
    }
  }, [ownedMap]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setStatusText("Lese Foto...");
    try {
      const loaded = await loadImageSource(file);
      const passes = buildUploadPasses(loaded.source, loaded.width, loaded.height);
      loaded.dispose();

      let cardFound = false;
      for (const pass of passes) {
        const text = await recognizeCanvas(pass.canvas);
        const res = await resolveScanRawText(text);
        if (res.success && res.card) {
          const key = `${res.card.Set}-${res.card.Number}`.toUpperCase();
          setFoundCard({ card: res.card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
          cardFound = true;
          break;
        }
      }
      if (!cardFound) setStatusText("Karte im Foto nicht erkannt.");
    } catch {
      setStatusText("Fehler beim Verarbeiten des Fotos.");
    } finally {
      setScanning(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScanning(true);
    const res = await resolveScanRawText(manualInput);
    setScanning(false);
    if (res.success && res.card) {
      const key = `${res.card.Set}-${res.card.Number}`.toUpperCase();
      setFoundCard({ card: res.card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
      setStatusText("");
    } else {
      setStatusText("Karte nicht gefunden.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <div className="absolute inset-x-8 bottom-8 h-20 rounded-lg border-2 border-dashed border-white/70 pointer-events-none flex items-center justify-center">
          <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">Fußzeile hier ausrichten</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="flex-1 rounded-lg bg-zinc-900 py-3 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {scanning ? "Scan läuft..." : "Karte scannen"}
        </button>
        <label className="flex-1 cursor-pointer rounded-lg border border-zinc-300 py-3 text-center font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
          Foto hochladen
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Manuell, z.B. SOR 10"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white dark:bg-zinc-200 dark:text-zinc-900">
          Suchen
        </button>
      </form>

      {statusText && <p className="text-sm text-zinc-600 dark:text-zinc-400">{statusText}</p>}

      {foundCard && (
        <div className="mt-6 border-t pt-4">
          <h3 className="mb-2 text-sm font-semibold">Gefundene Karte:</h3>
          <CardTile card={foundCard.card} owned={foundCard.owned} />
        </div>
      )}
    </div>
  );
}