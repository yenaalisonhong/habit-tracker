import { GoalProgressPanel } from "@/components/dashboard/GoalProgressPanel";
import { GoalHierarchy } from "@/components/dashboard/GoalHierarchy";
import { IntensityGrid } from "@/components/dashboard/IntensityGrid";
import { LayoutGrid, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-20 border-b border-pink-200 dark:border-pink-900/40 bg-white/85 dark:bg-pink-950/80 backdrop-blur-md shadow-sm shadow-pink-100/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="kawaii-float text-xl">🎀</span>
            <span className="font-bold text-pink-600 dark:text-pink-300">
              Habit Tracker
            </span>
            <span className="hidden sm:inline text-xs text-pink-300 font-medium">♡</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-pink-600 bg-pink-100 dark:bg-pink-950/60 dark:text-pink-300"
            >
              <LayoutGrid className="h-4 w-4" />
              대시보드
            </Link>
            <Link
              href="/statistics"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-pink-400 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-950/40 transition-colors"
            >
              <BarChart2 className="h-4 w-4" />
              통계
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
        <blockquote className="border-l-2 border-pink-300 dark:border-pink-700 pl-4">
          <p className="text-sm italic text-pink-500/90 dark:text-pink-300/90 leading-relaxed">
            „In jedem Anfang wohnt ein Zauber, der uns beschützt und der uns hilft, zu leben.“
          </p>
          <footer className="mt-1.5 text-xs text-pink-400/70">
            — Hermann Hesse
          </footer>
        </blockquote>

        <GoalProgressPanel />

        <section>
          <h2 className="mb-3 text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🌸</span> 목표 계층 구조
          </h2>
          <GoalHierarchy />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>💕</span> 14일 강도 히트맵
          </h2>
          <IntensityGrid />
        </section>
      </main>
    </div>
  );
}
