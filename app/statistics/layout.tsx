import { StatisticsLayout } from "@/components/statistics/StatisticsLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StatisticsLayout>{children}</StatisticsLayout>;
}
