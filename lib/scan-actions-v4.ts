"use server";

import { getCard, type SwuCard } from "@/lib/swu-api";

export async function lookupCard(set: string, number: string): Promise<SwuCard | null> {
  try {
    return await getCard(set, number);
  } catch {
    return null;
  }
}