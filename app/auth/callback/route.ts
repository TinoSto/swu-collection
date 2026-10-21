import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server-v2";

/**
 * Ziel des Bestätigungslinks aus der Registrierungs-Mail.
 * Tauscht den ?code gegen eine Session (PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback_failed", origin));
}