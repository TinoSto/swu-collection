import { createServerSupabase } from "@/lib/supabase-server-v2";
import { NavBar } from "@/components/NavBar-v2";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar email={user.email ?? ""} />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">{children}</main>
    </div>
  );
}