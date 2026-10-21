export interface ReferenceCandidate {
  set: string;
  number: string;
  text: string;
  score: number;
}

const DIGIT_LIKE: Record<string, string> = {
  O: "0", Q: "0", D: "0", I: "1", L: "1", S: "5", B: "8", Z: "2", G: "6",
};
const FOLD: Record<string, string> = { O: "0", I: "1", L: "1", S: "5", B: "8", Z: "2" };
const MAX_NUMBER_DISTANCE = 3;
const MAX_CANDIDATES = 5;

interface Token {
  value: string;
  start: number;
  end: number;
}

function foldSet(value: string): string {
  return [...value].map((ch) => FOLD[ch] ?? ch).join("");
}

function hamming(a: string, b: string): number {
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff;
}

function toDigits(token: string): string | null {
  if (!/^[0-9OQDILSBZG]{1,3}$/.test(token) || !/[0-9]/.test(token)) return null;
  return [...token].map((ch) => DIGIT_LIKE[ch] ?? ch).join("");
}

function matchSet(token: string, known: string[]): { set: string; quality: number } | null {
  if (token.length < 2 || token.length > 5 || !/[A-Z]/.test(token)) return null;
  if (known.length === 0) return { set: token, quality: 0.5 };
  if (known.includes(token)) return { set: token, quality: 3 };
  const folded = foldSet(token);
  const foldedMatch = known.find((k) => foldSet(k) === folded);
  if (foldedMatch) return { set: foldedMatch, quality: 2.5 };
  if (token.length >= 3) {
    const near = known.filter((k) => k.length === token.length && hamming(k, token) === 1);
    if (near.length === 1) return { set: near[0], quality: 2 };
  }
  return null;
}

function tokenize(text: string): Token[] {
  return [...text.matchAll(/[A-Z0-9]+/g)].map((m) => {
    const start = m.index ?? 0;
    return { value: m[0], start, end: start + m[0].length };
  });
}

function splitGlued(tokens: Token[], known: string[]): Token[] {
  const result: Token[] = [];
  for (const token of tokens) {
    const m = /^([A-Z]{2,5})([0-9OILSBZ]{1,3})$/.exec(token.value);
    const setPart = m?.[1];
    const numPart = m?.[2];
    if (setPart && numPart && toDigits(numPart)) {
      const match = matchSet(setPart, known);
      if (match && (known.length === 0 || match.quality >= 2)) {
        const split = token.start + setPart.length;
        result.push({ value: setPart, start: token.start, end: split });
        result.push({ value: numPart, start: split, end: token.end });
        continue;
      }
    }
    result.push(token);
  }
  return result;
}

export function extractReferenceCandidates(
  raw: string,
  knownSets: string[] = []
): ReferenceCandidate[] {
  const known = knownSets.map((s) => s.toUpperCase());
  const text = raw
    .toUpperCase()
    .replace(/[•·.,:;|_]/g, " ")
    .replace(/[^A-Z0-9/\- \n]/g, " ");
  const all = splitGlued(tokenize(text), known);
  const totals = new Set<number>();
  const strong = new Set<number>();
  for (let i = 0; i + 1 < all.length; i++) {
    const between = text.slice(all[i].end, all[i + 1].start);
    const a = toDigits(all[i].value);
    const b = toDigits(all[i + 1].value);
    if (a && b && b.length >= 2 && /^\s*\/\s*$/.test(between)) {
      strong.add(all[i].start);
      totals.add(all[i + 1].start);
    }
  }
  const core = all.filter((t) => !totals.has(t.start));
  const best = new Map<string, ReferenceCandidate>();
  core.forEach((numToken, i) => {
    const digits = toDigits(numToken.value);
    const numeric = digits ? parseInt(digits, 10) : 0;
    if (!digits || numeric === 0) return;
    core.forEach((setToken, j) => {
      const distance = Math.abs(i - j);
      if (i === j || distance > MAX_NUMBER_DISTANCE) return;
      const match = matchSet(setToken.value, known);
      if (!match) return;
      if (known.length > 0 && match.quality < 2) return;
      let score = match.quality;
      if (distance === 1) score += 1.5;
      else if (distance === 2) score += 0.3;
      if (strong.has(numToken.start)) score += 1;
      const from = Math.min(numToken.end, setToken.end);
      const to = Math.max(numToken.start, setToken.start);
      if (text.slice(from, to).includes("\n")) score -= 1;
      const number = String(numeric);
      const key = `${match.set}|${number}`;
      const existing = best.get(key);
      if (!existing || existing.score < score) {
        best.set(key, { set: match.set, number, text: `${match.set} ${digits}`, score });
      }
    });
  });
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_CANDIDATES);
}