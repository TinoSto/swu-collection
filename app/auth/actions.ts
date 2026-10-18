"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

const MIN_PASSWORD_LENGTH = 8;

/** Verhindert Open Redirects: nur interne Pfade zulassen. */
function safeNextPath(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  const isInternal =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  return isInternal ? next : "/";
}

/** Supabase-Fehlercode -> Schlüssel in lib/auth-messages.ts */
function errorKey(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "user_already_exists":
    case "email_exists":
      return "user_exists";
    case "weak_password":
      return "weak_password";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
    default:
      return "unknown";
  }
}

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  const fail = (error: string): never =>
    redirect(`/login?${new URLSearchParams({ error, next })}`);

  if (!email || !password) fail("missing_fields");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail(errorKey(error.code));

  redirect(next);
}

export async function register(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fail = (error: string): never =>
    redirect(`/register?${new URLSearchParams({ error })}`);

  if (!email || !password) fail("missing_fields");
  if (password.length < MIN_PASSWORD_LENGTH) fail("password_short");
  if (password !== confirm) fail("password_mismatch");

  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    console.log("=== SUPABASE FEHLER ===");
    console.log("Message:", error.message);
    console.log("Code:", error.code);
    console.log("======================");
    fail(errorKey(error.code));
  }

  // Mit deaktivierter E-Mail-Bestätigung kommt direkt eine Session zurück.
  if (data.session) redirect("/");

  redirect(`/login?${new URLSearchParams({ message: "confirm_email" })}`);
}

export async function logout(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}