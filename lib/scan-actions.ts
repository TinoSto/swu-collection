"use server";

import { getSets, getCard, type SwuCard } from "@/lib/swu-api";
import { extractReferenceCandidates, ReferenceCandidate } from "@/lib/ocr-parse";

export async function resolveScanRawText(rawText: string): Promise<{ success: boolean; card?: SwuCard; candidate?: ReferenceCandidate; candidates?: ReferenceCandidate[] }> {
  const sets = await getSets();
  const knownSetIds = sets.map((s) => s.setId);
  const candidates = extractReferenceCandidates(rawText, knownSetIds);

  for (const cand of candidates) {
    const card = await getCard(cand.set, cand.number);
    if (card) {
      return { success: true, card, candidate: cand };
    }
  }
  return { success: false, candidates };
}