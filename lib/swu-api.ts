/** Wrapper für die SWU-DB API (https://www.swu-db.com/api)
 * Endpunkte:
 *   GET /cards/{set}/{number}   -> einzelne Karte (Objekt)
 *   GET /cards/{set}            -> alle Karten eines Sets
 *   GET /cards/search?q=...     -> { total_cards, data: Card[] }
 *   GET /sets                   -> Set-Liste
 */
const BASE_URL = (
  process.env.NEXT_PUBLIC_SWU_API_BASE ?? "https://api.swu-db.com"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Typen (Felder wie von der API geliefert; viele sind optional)
// ---------------------------------------------------------------------------

export interface SwuCard {
  Set: string; // "SOR"
  Number: string; // "010" oder "82" – NICHT einheitlich gepaddet
  Name: string;
  Subtitle?: string;
  Type: string; // Leader, Unit, Event, Upgrade, Base, ...
  Aspects: string[];
  Traits: string[];
  Arenas?: string[];
  Cost?: string;
  Power?: string;
  HP?: string;
  FrontText?: string;
  BackText?: string;
  EpicAction?: string;
  DoubleSided: boolean;
  Rarity: string;
  Unique: boolean;
  Keywords?: string[];
  Artist?: string;
  VariantType: string; // "Normal", ...
  MarketPrice?: string;
  FoilPrice?: string;
  LowPrice?: string;
  LowFoilPrice?: string;
  FrontArt: string; // https://cdn.swu-db.com/images/cards/SOR/010.png
  BackArt?: string;
  cid?: string;
  tcgplayerId?: string;
}

export interface SwuSet {
  setId: string;
  fullName: string;
  numberCards: number;
  maxElement: string;
  releaseDate: string;
}

interface SearchResponse {
  total_cards: number;
  data: SwuCard[];
}

export class SwuApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "SwuApiError";
  }
}

// ---------------------------------------------------------------------------
// HTTP-Basis
// ---------------------------------------------------------------------------

/** Liefert null bei 404 (nicht gefunden / keine Treffer), wirft sonst bei Fehlern. */
async function request<T>(
  path: string,
  params?: Record<string, string>,
  revalidateSeconds = 3600
): Promise<T | null> {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}${qs}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: revalidateSeconds },
    });
  } catch {
    throw new SwuApiError("SWU-DB ist nicht erreichbar.");
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new SwuApiError(`SWU-DB Fehler (HTTP ${res.status}).`, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new SwuApiError("Ungültige Antwort der SWU-DB.", res.status);
  }
}

function extractCards(payload: SearchResponse | SwuCard[] | null): SwuCard[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

// ---------------------------------------------------------------------------
// API-Funktionen
// ---------------------------------------------------------------------------

/** Einzelne Karte per Set + Nummer. "sor"/"SOR" und "10"/"010" funktionieren. */
export async function getCard(
  set: string,
  number: string
): Promise<SwuCard | null> {
  return request<SwuCard>(
    `/cards/${encodeURIComponent(set.toLowerCase())}/${encodeURIComponent(number)}`
  );
}

/** Alle Basis-Karten eines Sets. */
export async function getSetCards(set: string): Promise<SwuCard[]> {
  const payload = await request<SearchResponse | SwuCard[]>(
    `/cards/${encodeURIComponent(set.toLowerCase())}`,
    { order: "setnumber" },
    86_400
  );
  return extractCards(payload);
}

/** Freitext-/Syntax-Suche (https://www.swu-db.com/syntax). Bare Words suchen im Namen. */
export async function searchCards(query: string): Promise<SwuCard[]> {
  const q = query.trim();
  if (!q) return [];
  const payload = await request<SearchResponse>("/cards/search", {
    q,
    order: "name",
  });
  return extractCards(payload);
}

/** Alle offiziellen Haupt-Sets für Filter-Dropdowns (bereinigt um Promos/Events). */
export async function getSets(): Promise<SwuSet[]> {
  const payload = await request<SwuSet[]>("/sets", undefined, 86_400);
  if (!payload) return [];

  return payload.filter(
    (set) =>
      !set.fullName.toLowerCase().includes("promo") &&
      !set.fullName.toLowerCase().includes("event") &&
      !set.setId.toLowerCase().includes("pr")
  );
}

// ---------------------------------------------------------------------------
// Sucheingabe: "sor 10", "SOR-010", "sor/10" -> Direktabruf, sonst Namens-/Syntaxsuche
// ---------------------------------------------------------------------------

const CARD_REF = /^([a-z][a-z0-9]{1,4})\s*[-/#\s]\s*(\d{1,3})$/i;

export function parseCardReference(
  input: string
): { set: string; number: string } | null {
  const m = CARD_REF.exec(input.trim());
  return m ? { set: m[1], number: m[2] } : null;
}

/** Zentrale Suchfunktion für die Suchleiste. */
export async function searchByInput(input: string): Promise<SwuCard[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const ref = parseCardReference(trimmed);
  if (ref) {
    const card = await getCard(ref.set, ref.number);
    if (card) return [card];
  }

  return searchCards(trimmed);
}

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------

export function cardKey(set: string, number: string): string {
  return `${set.toUpperCase()}-${number.replace(/^0+(?=\d)/, "")}`;
}

export function cardTitle(card: Pick<SwuCard, "Name" | "Subtitle">): string {
  return card.Subtitle ? `${card.Name} – ${card.Subtitle}` : card.Name;
}

export function cardImageUrl(
  set: string,
  number: string,
  face: "front" | "back" = "front"
): string {
  const base = `${BASE_URL}/cards/${encodeURIComponent(set.toLowerCase())}/${encodeURIComponent(number)}?format=image`;
  return face === "back" ? `${base}&face=back` : base;
}