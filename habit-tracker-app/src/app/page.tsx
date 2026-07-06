"use client";

import { useHabit } from "@/context/HabitContext";
import { Sidebar } from "@/components/Sidebar";
import { HabitGrid } from "@/components/HabitGrid";
import { StatsChart } from "@/components/StatsChart";
import { GoalProgressPanel } from "@/components/GoalProgressPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, BarChart2, Grid3x3 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function HomePage() {
  const { viewMode, setViewMode, initialized } = useHabit();

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div>
            <h2 className="font-semibold text-sm">
              {format(new Date(), "yyyy년 M월 d일 (eee)", { locale: ko })}
            </h2>
            <p className="text-xs text-muted-foreground">
              오늘도 시스템을 지켜나가세요 💪
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border overflow-hidden">
              {(["week", "month"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? "default" : "ghost"}
                  className="h-7 px-3 text-xs rounded-none gap-1"
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "week" ? (
                    <>
                      <Calendar className="w-3 h-3" /> 주간
                    </>
                  ) : (
                    <>
                      <Grid3x3 className="w-3 h-3" /> 월간
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="grid" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="grid" className="gap-1.5 text-xs">
              <Grid3x3 className="w-3.5 h-3.5" />
              그리드
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5 text-xs">
              <BarChart2 className="w-3.5 h-3.5" />
              통계
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="grid"
            className="flex-1 overflow-hidden mt-0 pt-4"
          >
            <ScrollArea className="h-full px-6">
              <div className="pb-6 space-y-0">
                {/* ── Goal/System progress gauges ── */}
                <GoalProgressPanel />
                <HabitGrid />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="stats"
            className="flex-1 overflow-hidden mt-0 pt-4"
          >
            <ScrollArea className="h-full px-6">
              <div className="pb-6">
                <StatsChart />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
