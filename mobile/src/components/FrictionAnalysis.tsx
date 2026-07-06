import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTracker } from '../context/TrackerContext';
import { FrictionType, FRICTION_OPTIONS, FRICTION_COLORS, FRICTION_INSIGHTS } from '../types';
import { getFrictionCountsFromSummaries } from '../utils/log-archive';
import { colors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width - 48;

export default function FrictionAnalysis() {
  const { logs, yearlySummaries } = useTracker();

  const frictionCounts = useMemo(() => {
    const counts: Partial<Record<FrictionType, number>> =
      getFrictionCountsFromSummaries(yearlySummaries);

    logs
      .filter((l) => l.friction)
      .forEach((l) => {
        const f = l.friction!;
        counts[f] = (counts[f] ?? 0) + 1;
      });

    return counts;
  }, [logs, yearlySummaries]);

  const pieData = useMemo(() => {
    return FRICTION_OPTIONS.filter((f) => (frictionCounts[f] ?? 0) > 0).map((f) => ({
      name: f,
      population: frictionCounts[f] ?? 0,
      color: FRICTION_COLORS[f],
      legendFontColor: colors.textSecondary,
      legendFontSize: 11,
    }));
  }, [frictionCounts]);

  const dominantFriction = useMemo((): FrictionType | null => {
    const entries = FRICTION_OPTIONS
      .map((f) => ({ f, count: frictionCounts[f] ?? 0 }))
      .filter((e) => e.count > 0);
    if (entries.length === 0) return null;
    return entries.reduce((best, e) => (e.count > best.count ? e : best)).f;
  }, [frictionCounts]);

  if (pieData.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>방해 요인 분석</Text>
        <Text style={styles.emptyText}>
          아직 방해 요인 기록이 없습니다. 습관 달성값이 0일 때 이유를 기록해보세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>방해 요인 분석</Text>

      <View style={styles.content}>
        {Platform.OS !== 'web' && pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={Math.min(screenWidth, 220)}
            height={180}
            chartConfig={{ color: () => colors.text }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        ) : (
          <View style={styles.webPieFallback}>
            {pieData.map((item) => (
              <View key={item.name} style={styles.webPieRow}>
                <View style={[styles.webPieDot, { backgroundColor: item.color }]} />
                <Text style={styles.webPieLabel}>{item.name}</Text>
                <Text style={styles.webPieValue}>{item.population}회</Text>
              </View>
            ))}
          </View>
        )}

        {dominantFriction && (
          <View style={styles.insightBox}>
            <Text style={styles.insightLabel}>⚠️ 주요 방해 요인: {dominantFriction}</Text>
            <Text style={styles.insightText}>{FRICTION_INSIGHTS[dominantFriction]}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  content: { gap: 12 },
  webPieFallback: { gap: 8 },
  webPieRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  webPieDot: { width: 10, height: 10, borderRadius: 5 },
  webPieLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  webPieValue: { fontSize: 12, color: colors.textMuted },
  insightBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 12,
  },
  insightLabel: { fontSize: 12, fontWeight: '600', color: '#b45309', marginBottom: 6 },
  insightText: { fontSize: 13, color: colors.zinc700, lineHeight: 20 },
});
