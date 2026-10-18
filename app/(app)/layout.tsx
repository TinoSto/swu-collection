import Link from "next/link";
import { logout } from "../(auth)/actions";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-gray-100 pb-20 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-[#0b0f17]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-wider text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">
            SWU<span className="text-white font-light text-sm ml-1.5">Collection</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <form action={logout}>
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900/50 hover:bg-red-950/40 hover:border-red-800 hover:text-red-300 transition-all font-medium text-gray-300"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800/80 bg-[#0b0f17]/90 backdrop-blur-lg flex justify-around py-2.5 px-4 md:hidden">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-xs font-medium text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Sammlung
        </Link>
        <Link
          href="/search"
          className="flex flex-col items-center gap-1 text-xs font-medium text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Suchen
        </Link>
      </nav>
    </div>
  );
}