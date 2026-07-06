import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { colors } from '../theme/colors';
import { completionColor } from '../utils/completion';
import { parseLocalDate } from '../utils/dates';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct}%`, backgroundColor: completionColor(pct) },
        ]}
      />
    </View>
  );
}

function GaugeCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <View style={styles.gaugeCard}>
      <Text style={[styles.gaugePct, { color: completionColor(value) }]}>
        {Math.round(value)}%
      </Text>
      <Text style={styles.gaugeLabel}>{label}</Text>
      {sub ? <Text style={styles.gaugeSub}>{sub}</Text> : null}
      <ProgressBar value={value} />
    </View>
  );
}

export default function GoalProgressPanel() {
  const { goalsWithCompletion, todayDate } = useTracker();

  if (goalsWithCompletion.length === 0) return null;

  const overallAvg = Math.round(
    goalsWithCompletion.reduce((sum, g) => sum + g.completion, 0) / goalsWithCompletion.length
  );

  const dateLabel = parseLocalDate(todayDate).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💖 오늘의 달성률</Text>
        <Text style={styles.headerDate}>{dateLabel}</Text>
      </View>

      <GaugeCard label="전체 평균" value={overallAvg} />

      {goalsWithCompletion.map((goal) => (
        <View key={goal.id} style={styles.goalBlock}>
          <GaugeCard
            label={goal.title}
            value={goal.completion}
            sub={`${goal.quarter} ${goal.year}`}
          />
          {goal.systems.map((sys) => (
            <View key={sys.id} style={styles.systemRow}>
              <View style={styles.systemLabelRow}>
                <Text style={styles.systemTitle} numberOfLines={1}>
                  {sys.title}
                </Text>
                <Text style={[styles.systemPct, { color: completionColor(sys.completion) }]}>
                  {Math.round(sys.completion)}%
                </Text>
              </View>
              <ProgressBar value={sys.completion} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerDate: { fontSize: 12, color: colors.textMuted },
  gaugeCard: { gap: 4 },
  gaugePct: { fontSize: 28, fontWeight: '800' },
  gaugeLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  gaugeSub: { fontSize: 11, color: colors.textMuted },
  goalBlock: { gap: 8, marginTop: 4 },
  systemRow: { marginLeft: 8, gap: 4 },
  systemLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  systemTitle: { fontSize: 12, color: colors.textSecondary, flex: 1, marginRight: 8 },
  systemPct: { fontSize: 12, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: colors.zinc100,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
});
