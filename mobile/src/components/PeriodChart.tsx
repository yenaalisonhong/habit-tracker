import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTracker } from '../context/TrackerContext';
import { colors } from '../theme/colors';
import {
  getLastNWeekBuckets,
  getLastNMonthBuckets,
  getLastNYearBuckets,
  bucketCompletion,
} from '../utils/dateBuckets';

export type ChartPeriod = 'weekly' | 'monthly' | 'yearly';

const PERIOD_CONFIG: Record<ChartPeriod, { title: string; subtitle: string; bucketCount: number }> = {
  weekly: { title: '주별 Goal 달성률 추이', subtitle: '최근 12주 · 주간 평균 달성률', bucketCount: 12 },
  monthly: { title: '월별 Goal 달성률 추이', subtitle: '최근 12개월 · 월간 평균 달성률', bucketCount: 12 },
  yearly: { title: '연별 Goal 달성률 추이', subtitle: '최근 5년 · 연간 평균 달성률', bucketCount: 5 },
};

const CHART_COLORS = ['#FF6B9D', '#FF85A2', '#FFB7C5', '#E84A7F', '#FFC8D6', '#A8D8F0', '#FFD6E0'];
const screenWidth = Dimensions.get('window').width - 48;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 107, 157, ${opacity})`,
  labelColor: () => colors.textMuted,
  propsForDots: { r: '3' },
  propsForBackgroundLines: { stroke: '#FFD6E0' },
};

function getBuckets(period: ChartPeriod) {
  const count = PERIOD_CONFIG[period].bucketCount;
  if (period === 'weekly') return getLastNWeekBuckets(count);
  if (period === 'monthly') return getLastNMonthBuckets(count);
  return getLastNYearBuckets(count);
}

interface Props {
  period: ChartPeriod;
}

export default function PeriodChart({ period }: Props) {
  const { goals, getGoalCompletion } = useTracker();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const config = PERIOD_CONFIG[period];

  const { labels, datasets, legend } = useMemo(() => {
    if (goals.length === 0) return { labels: [], datasets: [], legend: [] };

    const buckets = getBuckets(period);
    const labels = buckets.map((b) => b.label);
    const goalDatasets = goals.map((goal) =>
      buckets.map(({ dates }) =>
        bucketCompletion(dates, (date) => getGoalCompletion(goal.id, date))
      )
    );
    const avgDataset = buckets.map(({ dates }) => {
      if (goals.length === 0) return 0;
      const total = goals.reduce(
        (sum, goal) => sum + bucketCompletion(dates, (date) => getGoalCompletion(goal.id, date)),
        0
      );
      return Math.round(total / goals.length);
    });

    return {
      labels,
      datasets: [...goalDatasets, avgDataset] as number[][],
      legend: [...goals.map((g) => g.title), '전체 평균'],
    };
  }, [period, goals, getGoalCompletion]);

  if (goals.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyText}>아직 목표가 없습니다.</Text>
      </View>
    );
  }

  const chartData = {
    labels,
    datasets: datasets.map((data, i) => ({
      data,
      color: () => (legend[i] === '전체 평균' ? '#71717a' : CHART_COLORS[i % CHART_COLORS.length]),
      strokeWidth: legend[i] === '전체 평균' ? 1 : 2,
    })),
    legend,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
        <View style={styles.toggleGroup}>
          {(['line', 'bar'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setChartType(t)}
              style={[styles.toggleBtn, chartType === t && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, chartType === t && styles.toggleTextActive]}>
                {t === 'line' ? '꺾은선' : '막대'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.chartCard}>
        {Platform.OS === 'web' ? (
          <WebChartFallback labels={labels} datasets={datasets} legend={legend} chartType={chartType} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartType === 'line' ? (
              <LineChart
                data={chartData}
                width={Math.max(screenWidth, labels.length * 50)}
                height={240}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero
                yAxisSuffix="%"
              />
            ) : (
              <BarChart
                data={chartData}
                width={Math.max(screenWidth, labels.length * 50)}
                height={240}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                yAxisLabel=""
                yAxisSuffix="%"
                showValuesOnTopOfBars={false}
              />
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function WebChartFallback({
  labels,
  datasets,
  legend,
  chartType,
}: {
  labels: string[];
  datasets: number[][];
  legend: string[];
  chartType: 'line' | 'bar';
}) {
  const maxVal = Math.max(100, ...datasets.flatMap((d) => d));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 8 }}>
      <View style={{ minWidth: 320 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', minHeight: 180, gap: 6 }}>
          {labels.map((label, col) => (
            <View key={label + col} style={{ alignItems: 'center', minWidth: 40 }}>
              {chartType === 'bar' ? (
                datasets.slice(0, 3).map((series, row) => (
                  <View
                    key={row}
                    style={{
                      width: 8,
                      height: Math.max(4, (series[col] / maxVal) * 120),
                      backgroundColor: CHART_COLORS[row % CHART_COLORS.length],
                      borderRadius: 3,
                      marginBottom: 2,
                    }}
                  />
                ))
              ) : (
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary, marginBottom: 6 }}>
                  {datasets[0]?.[col] ?? 0}%
                </Text>
              )}
              <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: 'center', maxWidth: 40 }} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          {legend.map((name, i) => (
            <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  toggleGroup: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: '#fff' },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  chart: { borderRadius: 8 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
