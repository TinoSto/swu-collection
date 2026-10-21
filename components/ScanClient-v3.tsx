"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { recognizeCanvas, warmUpOcr } from "@/lib/ocr-engine-v2";
import {
  buildCameraPasses,
  buildUploadPasses,
  containerRectToVideoRect,
  loadImageSource,
} from "@/lib/ocr-image";
import { resolveScanRawText } from "@/lib/scan-actions-v3";
import { CardTile } from "@/components/CardTile";
import type { OwnedCounts } from "@/lib/collection-types";
import type { SwuCard } from "@/lib/swu-api";

export function ScanClient({ ownedMap }: { ownedMap: Record<string, OwnedCounts> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [debugText, setDebugText] = useState("");
  const [foundCard, setFoundCard] = useState<{ card: SwuCard; owned: OwnedCounts } | null>(null);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    warmUpOcr();
    navigator.mediaDevices?.getUserMedia?.({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => setStatusText("Kamera nicht verfügbar. Nutze Datei-Upload."));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScan = useCallback(async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!video || !container || !overlay || !video.videoWidth) return;
    setScanning(true);
    setDebugText("");
    setStatusText("Analysiere Bild...");
    try {
      const region = containerRectToVideoRect(
        { width: container.clientWidth, height: container.clientHeight },
        { width: video.videoWidth, height: video.videoHeight },
        {
          x: overlay.offsetLeft,
          y: overlay.offsetTop,
          width: overlay.offsetWidth,
          height: overlay.offsetHeight,
        }
      );
      setDebugText(
        `Video ${video.videoWidth}x${video.videoHeight}, Region ${Math.round(region.width)}x${Math.round(region.height)}\n`
      );
      const passes = buildCameraPasses(video, region);

      let cardFound = false;
      for (const pass of passes) {
        const text = await recognizeCanvas(pass.canvas);
        const compact = text.trim().split(/\s+/).join(" ");
        setDebugText((prev) => `${prev}[${pass.label}] ${compact}\n`);
        const res = await resolveScanRawText(text);
        if (res.success && res.card) {
          const key = `${res.card.Set}-${res.card.Number}`.toUpperCase();
          setFoundCard({ card: res.card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
          if (res.candidate) {
            setDebugText(
              (prev) =>
                `${prev}=> ${res.candidate!.set} ${res.candidate!.number} (Score ${res.candidate!.score.toFixed(1)})\n`
            );
          }
          setStatusText("");
          cardFound = true;
          break;
        }
      }
      if (!cardFound) {
        setStatusText("Keine sichere Erkennung. Versuche es erneut.");
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
    setDebugText("");
    setStatusText("Lese Foto...");
    try {
      const loaded = await loadImageSource(file);
      const passes = buildUploadPasses(loaded.source, loaded.width, loaded.height);
      loaded.dispose();

      let cardFound = false;
      for (const pass of passes) {
        const text = await recognizeCanvas(pass.canvas);
        const compact = text.trim().split(/\s+/).join(" ");
        setDebugText((prev) => `${prev}[${pass.label}] ${compact}\n`);
        const res = await resolveScanRawText(text);
        if (res.success && res.card) {
          const key = `${res.card.Set}-${res.card.Number}`.toUpperCase();
          setFoundCard({ card: res.card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
          setStatusText("");
          cardFound = true;
          break;
        }
      }
      if (!cardFound) setStatusText("Karte im Foto nicht sicher erkannt.");
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
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black"
      >
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <div
          ref={overlayRef}
          className="absolute inset-x-2 bottom-3 h-16 rounded-lg border-2 border-dashed border-white/70 pointer-events-none flex items-start justify-center"
        >
          <span className="mt-1 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded">
            Fußzeile (Set + Nummer) hier einpassen
          </span>
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

      {debugText && (
        <pre className="whitespace-pre-wrap break-words text-xs text-zinc-500">{debugText}</pre>
      )}

      {foundCard && (
        <div className="mt-6 border-t pt-4">
          <h3 className="mb-2 text-sm font-semibold">Gefundene Karte:</h3>
          <CardTile card={foundCard.card} owned={foundCard.owned} />
        </div>
      )}
    </div>
  );
}