import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTracker } from '../context/TrackerContext';
import { colors } from '../theme/colors';
import { generateDateRange, formatShortDate } from '../utils/dates';

const CHART_COLORS = ['#FF6B9D', '#FF85A2', '#FFB7C5', '#FFC8D6', '#E84A7F', '#A8D8F0', '#FFD6E0'];
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

export default function CompletionCharts() {
  const { goals, getGoalCompletion } = useTracker();

  const { labels, datasets, legend } = useMemo(() => {
    if (goals.length === 0) return { labels: [], datasets: [], legend: [] };

    const dates = generateDateRange(14);
    const labels = dates.map(formatShortDate);
    const datasets = goals.map((goal) =>
      dates.map((date) => Math.round(getGoalCompletion(goal.id, date)))
    );

    return { labels, datasets, legend: goals.map((g) => g.title) };
  }, [goals, getGoalCompletion]);

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
      color: () => CHART_COLORS[i % CHART_COLORS.length],
      strokeWidth: 2,
    })),
    legend,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>14일 Goal 달성률 추이</Text>
      <View style={styles.chartCard}>
        {Platform.OS === 'web' ? (
          <WebChartFallback labels={labels} datasets={datasets} legend={legend} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth, labels.length * 44)}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
              yAxisSuffix="%"
            />
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
}: {
  labels: string[];
  datasets: number[][];
  legend: string[];
}) {
  const maxVal = Math.max(100, ...datasets.flatMap((d) => d));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.webChartScroll}>
      <View style={styles.webChart}>
        <View style={styles.webChartPlot}>
          {labels.map((label, col) => (
            <View key={label + col} style={styles.webChartCol}>
              <Text style={styles.webLineValue}>{datasets[0]?.[col] ?? 0}%</Text>
              <Text style={styles.webLabel} numberOfLines={1}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.webLegend}>
          {legend.map((name, i) => (
            <View key={name} style={styles.webLegendItem}>
              <View style={[styles.webLegendDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
              <Text style={styles.webLegendText} numberOfLines={1}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  chart: { borderRadius: 8 },
  webChartScroll: { paddingHorizontal: 8 },
  webChart: { minWidth: 320, paddingBottom: 4 },
  webChartPlot: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 160, gap: 8 },
  webChartCol: { alignItems: 'center', minWidth: 40, gap: 4 },
  webLineValue: { fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  webLabel: { fontSize: 10, color: colors.textMuted, maxWidth: 44, textAlign: 'center' },
  webLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  webLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '48%' },
  webLegendDot: { width: 8, height: 8, borderRadius: 4 },
  webLegendText: { fontSize: 10, color: colors.textSecondary, flexShrink: 1 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
