"use server";

import { getSets, getCard, type SwuCard } from "@/lib/swu-api";
import { extractReferenceCandidates, ReferenceCandidate } from "@/lib/ocr-parse";

const OFFICIAL_SET_IDS = [
  "SOR", "SHD", "TWI", "JTL", "LOF", "LAW", "SEC", "ASH", "HMW", "IBH", "TS26",
];
const MIN_SCORE = 3;

export async function resolveScanRawText(rawText: string): Promise<{
  success: boolean;
  card?: SwuCard;
  candidate?: ReferenceCandidate;
  candidates?: ReferenceCandidate[];
}> {
  let apiSetIds: string[] = [];
  try {
    apiSetIds = (await getSets()).map((s) => s.setId.toUpperCase());
  } catch {
    // API nicht erreichbar: feste Liste reicht
  }
  const knownSetIds = Array.from(new Set([...apiSetIds, ...OFFICIAL_SET_IDS]));
  const candidates = extractReferenceCandidates(rawText, knownSetIds).filter(
    (c) => c.score >= MIN_SCORE
  );

  for (const cand of candidates) {
    const card = await getCard(cand.set, cand.number);
    if (card) {
      return { success: true, card, candidate: cand };
    }
  }
  return { success: false, candidates };
}