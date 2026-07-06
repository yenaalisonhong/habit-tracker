import GoalHierarchy from '@/components/dashboard/GoalHierarchy';
import IntensityGrid from '@/components/dashboard/IntensityGrid';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <blockquote className="border-l-2 border-emerald-500 pl-4">
        <p className="text-base italic text-zinc-700 dark:text-zinc-300 leading-relaxed">
          „Was du heute kannst besorgen, das verschiebe nicht auf morgen.“
        </p>
        <footer className="mt-2 text-sm text-zinc-400">
          — Johann Wolfgang von Goethe
        </footer>
      </blockquote>

      <section>
        <IntensityGrid />
      </section>

      <section>
        <GoalHierarchy />
      </section>
    </div>
  );
}
