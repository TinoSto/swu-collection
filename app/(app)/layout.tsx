import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { NavBar } from "@/components/NavBar";
import { createServerSupabase } from "@/lib/supabase-server";

export default function AppLayout({ children }: { children: ReactNode }) {
  // Die Session wird zur Request-Zeit gelesen und liegt deshalb hinter einer Suspense-Grenze.
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Lade …</p>}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

/** Zweite Absicherung neben dem Proxy: ohne gültige Session gibt es keinen Inhalt. */
async function AuthGate({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <>
      <NavBar email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}