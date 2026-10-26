import { createServerSupabase } from "@/lib/supabase-server-v2";

const PAGE_SIZE = 1000; // Supabase liefert pro Abfrage maximal 1000 Zeilen

export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Nicht eingeloggt", { status: 401 });

  type Row = {
    set_code: string;
    card_number: string;
    count_normal: number;
    count_foil: number;
  };

  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("user_cards")
      .select("set_code, card_number, count_normal, count_foil")
      .range(from, from + PAGE_SIZE - 1);
    if (error) return new Response(error.message, { status: 500 });
    rows.push(...(data as Row[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  // Sortierung nach Set, dann numerisch nach Kartennummer
  rows.sort(
    (a, b) =>
      a.set_code.localeCompare(b.set_code) ||
      a.card_number.localeCompare(b.card_number, undefined, { numeric: true })
  );

  // Semikolon als Trenner und BOM, damit deutsches Excel Spalten und Umlaute richtig erkennt
  const lines = [
    "Set;Nummer;Normal;Foil",
    ...rows.map((r) => `${r.set_code};${r.card_number};${r.count_normal};${r.count_foil}`),
  ];
  const csv = "\uFEFF" + lines.join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="swu-sammlung-${date}.csv"`,
    },
  });
}