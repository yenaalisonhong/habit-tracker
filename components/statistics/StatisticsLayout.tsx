"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart2 } from "lucide-react";

const PERIOD_LINKS = [
  { href: "/statistics", label: "일별" },
  { href: "/statistics/weekly", label: "주별" },
  { href: "/statistics/monthly", label: "월별" },
  { href: "/statistics/yearly", label: "연별" },
] as const;

export function StatisticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-pink-200 dark:border-pink-900/40 bg-white/85 dark:bg-pink-950/80 backdrop-blur-md shadow-sm shadow-pink-100/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="kawaii-float text-xl">🎀</span>
            <span className="font-bold text-pink-600 dark:text-pink-300">
              Habit Tracker
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-pink-400 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-950/40 transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              대시보드
            </Link>
            <Link
              href="/statistics"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-pink-600 bg-pink-100 dark:bg-pink-950/60 dark:text-pink-300"
            >
              <BarChart2 className="h-4 w-4" />
              통계
            </Link>
          </nav>
        </div>
      </header>

      <div className="border-b border-pink-200 dark:border-pink-900/40 bg-white/90 dark:bg-pink-950/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {PERIOD_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/statistics"
                  ? pathname === "/statistics"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-pink-400 text-white shadow-sm shadow-pink-200"
                      : "text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
