import { createBrowserClient } from "@supabase/ssr";

export interface UserCard {
  id: string;
  user_id: string;
  set_code: string;
  card_number: string;
  count_normal: number;
  count_foil: number;
  created_at: string;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY müssen in .env.local gesetzt sein."
    );
  }
  return createBrowserClient(url, key);
}