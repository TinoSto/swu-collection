"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { recognizeCanvas, warmUpOcr } from "@/lib/ocr-engine-v2";
import {
  buildCameraPasses,
  buildUploadPasses,
  containerRectToVideoRect,
  loadImageSource,
} from "@/lib/ocr-image";
import { extractReferenceCandidates, type ReferenceCandidate } from "@/lib/ocr-parse";
import { lookupCard } from "@/lib/scan-actions-v4";
import { CardTile } from "@/components/CardTile";
import type { OwnedCounts } from "@/lib/collection-types";
import type { SwuCard } from "@/lib/swu-api";

const KNOWN_SETS = ["SOR", "SHD", "TWI", "JTL", "LOF", "LAW", "SEC", "ASH", "HMW", "IBH", "TS26"];
const MIN_SCORE = 3;
const MAX_FRAMES = 3;

type Vote = { cand: ReferenceCandidate; total: number; hits: number };

function bestCandidate(text: string): ReferenceCandidate | null {
  const list = extractReferenceCandidates(text, KNOWN_SETS).filter((c) => c.score >= MIN_SCORE);
  return list[0] ?? null;
}

function addVote(votes: Map<string, Vote>, cand: ReferenceCandidate) {
  const key = `${cand.set}|${cand.number}`;
  const v = votes.get(key);
  if (v) {
    v.total += cand.score;
    v.hits += 1;
  } else {
    votes.set(key, { cand, total: cand.score, hits: 1 });
  }
}

function topVote(votes: Map<string, Vote>): Vote | null {
  let best: Vote | null = null;
  for (const v of votes.values()) {
    if (!best || v.hits > best.hits || (v.hits === best.hits && v.total > best.total)) {
      best = v;
    }
  }
  return best;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ScanClient({ ownedMap }: { ownedMap: Record<string, OwnedCounts> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [debugText, setDebugText] = useState("");
  const [foundCard, setFoundCard] = useState<{ card: SwuCard; owned: OwnedCounts } | null>(null);
  const [detected, setDetected] = useState<{ set: string; number: string } | null>(null);
  const [correction, setCorrection] = useState("");
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    warmUpOcr();
    navigator.mediaDevices?.getUserMedia?.({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        try {
          await s.getVideoTracks()[0]?.applyConstraints({
            advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
          });
        } catch {
          // Dauerfokus nicht unterstützt: ignorieren
        }
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => setStatusText("Kamera nicht verfügbar. Nutze Datei-Upload."));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const showCard = useCallback(
    async (set: string, number: string): Promise<boolean> => {
      const card = await lookupCard(set, number);
      if (!card) {
        setFoundCard(null);
        setStatusText(`Karte ${set} ${number} nicht gefunden.`);
        return false;
      }
      const key = `${card.Set}-${card.Number}`.toUpperCase();
      setFoundCard({ card, owned: ownedMap[key] || { normal: 0, foil: 0 } });
      setDetected({ set, number });
      setCorrection(number);
      setStatusText("");
      return true;
    },
    [ownedMap]
  );

  const handleScan = useCallback(async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!video || !container || !overlay || !video.videoWidth) return;
    setScanning(true);
    setDebugText("");
    setFoundCard(null);
    setDetected(null);
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

      const votes = new Map<string, Vote>();
      for (let frame = 1; frame <= MAX_FRAMES; frame++) {
        const passes = buildCameraPasses(video, region);
        for (const pass of passes) {
          const text = await recognizeCanvas(pass.canvas);
          const compact = text.trim().split(/\s+/).join(" ");
          const cand = bestCandidate(text);
          setDebugText(
            (prev) =>
              `${prev}#${frame} [${pass.label}] ${compact}${
                cand ? ` => ${cand.set} ${cand.number} (${cand.score.toFixed(1)})` : ""
              }\n`
          );
          if (cand) {
            addVote(votes, cand);
            break;
          }
        }
        const leader = topVote(votes);
        if (leader && leader.hits >= 2) break;
        if (frame < MAX_FRAMES) await sleep(300);
      }

      const winner = topVote(votes);
      if (!winner) {
        setStatusText("Keine sichere Erkennung. Versuche es erneut.");
        return;
      }
      await showCard(winner.cand.set, winner.cand.number);
    } catch {
      setStatusText("Fehler beim Scannen.");
    } finally {
      setScanning(false);
    }
  }, [showCard]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setDebugText("");
    setFoundCard(null);
    setDetected(null);
    setStatusText("Lese Foto...");
    try {
      const loaded = await loadImageSource(file);
      const passes = buildUploadPasses(loaded.source, loaded.width, loaded.height);
      loaded.dispose();

      let found: ReferenceCandidate | null = null;
      for (const pass of passes) {
        const text = await recognizeCanvas(pass.canvas);
        const compact = text.trim().split(/\s+/).join(" ");
        const cand = bestCandidate(text);
        setDebugText(
          (prev) =>
            `${prev}[${pass.label}] ${compact}${
              cand ? ` => ${cand.set} ${cand.number} (${cand.score.toFixed(1)})` : ""
            }\n`
        );
        if (cand) {
          found = cand;
          break;
        }
      }
      if (!found) {
        setStatusText("Karte im Foto nicht sicher erkannt.");
        return;
      }
      await showCard(found.set, found.number);
    } catch {
      setStatusText("Fehler beim Verarbeiten des Fotos.");
    } finally {
      setScanning(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const cand = bestCandidate(manualInput);
    if (!cand) {
      setStatusText("Eingabe nicht verstanden, z.B. ASH 80.");
      return;
    }
    setScanning(true);
    await showCard(cand.set, cand.number);
    setScanning(false);
  }

  async function handleCorrection(e: React.FormEvent) {
    e.preventDefault();
    const digits = correction.replace(/\D/g, "");
    if (!detected || !digits) return;
    setScanning(true);
    await showCard(detected.set, String(parseInt(digits, 10)));
    setScanning(false);
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
          className="absolute inset-x-2 bottom-3 h-16 rounded-lg border-2 border-dashed border-white/70 pointer-events-none"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Fußzeile mit Set und Nummer in den Rahmen legen, Karte ruhig halten, bis das Bild
        scharf ist, dann scannen.
      </p>

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

      {detected && (
        <form onSubmit={handleCorrection} className="flex items-center gap-2 text-sm">
          <span>
            Gelesen: <strong>{detected.set}</strong>
          </span>
          <input
            inputMode="numeric"
            aria-label="Kartennummer"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            className="w-20 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={scanning}
            className="rounded-lg border border-zinc-300 px-3 py-1 dark:border-zinc-700"
          >
            Nummer laden
          </button>
        </form>
      )}

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