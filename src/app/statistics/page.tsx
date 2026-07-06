import CompletionCharts from '@/components/statistics/CompletionCharts';
import FrictionAnalysis from '@/components/statistics/FrictionAnalysis';

export default function StatisticsPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">통계 & 회고</h1>
        <p className="text-sm text-zinc-400">달성률 추이와 실패 원인을 분석해 다음 분기를 준비하세요.</p>
      </div>

      <CompletionCharts />

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-8">
        <FrictionAnalysis />
      </div>
    </div>
  );
}
