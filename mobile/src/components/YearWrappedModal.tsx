import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { computeYearWrappedStats } from '../utils/year-wrapped';
import { completionColor } from '../utils/completion';
import { colors } from '../theme/colors';

interface YearWrappedModalProps {
  year: number;
  visible: boolean;
  onClose: () => void;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function CompletionRow({
  title,
  subtitle,
  completion,
  achieved,
  extra,
}: {
  title: string;
  subtitle?: string;
  completion: number;
  achieved: boolean;
  extra?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {extra ? <Text style={styles.rowExtra}>{extra}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {achieved && (
          <View style={styles.achievedBadge}>
            <Text style={styles.achievedText}>달성</Text>
          </View>
        )}
        <Text style={[styles.rowPct, { color: completionColor(completion) }]}>
          {completion}%
        </Text>
      </View>
    </View>
  );
}

export default function YearWrappedModal({ year, visible, onClose }: YearWrappedModalProps) {
  const {
    goals,
    systems,
    habits,
    logs,
    yearlySummaries,
    getGoalCompletion,
    getSystemCompletion,
  } = useTracker();

  const stats = useMemo(
    () =>
      computeYearWrappedStats(
        year,
        goals,
        systems,
        habits,
        logs,
        yearlySummaries,
        getGoalCompletion,
        getSystemCompletion
      ),
    [year, goals, systems, habits, logs, yearlySummaries, getGoalCompletion, getSystemCompletion]
  );

  const hasData = stats.totalGoals > 0 || stats.totalDaysLogged > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>✨ Year in Review</Text>
              <Text style={styles.heroTitle}>YEAR {year} WRAPPED</Text>
              <Text style={styles.heroDesc}>올해의 목표 · 시스템 · 습관을 돌아봅니다</Text>

              {hasData && (
                <View style={styles.statGrid}>
                  <StatCard
                    label="목표 달성"
                    value={`${stats.achievedGoals}/${stats.totalGoals}`}
                    sub={`평균 ${stats.overallGoalCompletion}%`}
                  />
                  <StatCard
                    label="시스템"
                    value={`${stats.achievedSystems}/${stats.totalSystems}`}
                    sub="80% 이상"
                  />
                  <StatCard
                    label="습관"
                    value={`${stats.achievedHabits}/${stats.totalHabits}`}
                    sub={`${stats.totalDaysLogged}일 기록`}
                  />
                </View>
              )}
            </View>

            <View style={styles.body}>
              {!hasData ? (
                <Text style={styles.emptyText}>
                  {year}년 기록이 아직 없습니다.{'\n'}내년에는 멋진 한 해를 만들어보세요!
                </Text>
              ) : (
                <>
                  {(stats.bestGoal || stats.bestHabit) && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🏆 올해의 하이라이트</Text>
                      {stats.bestGoal && stats.bestGoal.completion > 0 && (
                        <View style={[styles.highlightCard, styles.highlightAmber]}>
                          <Text style={styles.highlightLabel}>최고 목표</Text>
                          <Text style={styles.highlightTitle}>{stats.bestGoal.goal.title}</Text>
                          <Text style={styles.highlightSub}>
                            {stats.bestGoal.goal.quarter} · {stats.bestGoal.completion}% 달성
                          </Text>
                        </View>
                      )}
                      {stats.bestHabit && stats.bestHabit.completion > 0 && (
                        <View style={[styles.highlightCard, styles.highlightEmerald]}>
                          <Text style={[styles.highlightLabel, { color: colors.emeraldDark }]}>
                            최고 습관
                          </Text>
                          <Text style={styles.highlightTitle}>{stats.bestHabit.habit.title}</Text>
                          <Text style={[styles.highlightSub, { color: colors.emerald }]}>
                            목표 달성 {stats.bestHabit.daysMetTarget}일 / 기록{' '}
                            {stats.bestHabit.daysRecorded}일 ({stats.bestHabit.completion}%)
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {stats.goals.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        🎯 목표 ({stats.achievedGoals}개 달성)
                      </Text>
                      {stats.goals.map(({ goal, completion, achieved }) => (
                        <CompletionRow
                          key={goal.id}
                          title={goal.title}
                          subtitle={`${goal.quarter} · ${goal.year}`}
                          completion={completion}
                          achieved={achieved}
                        />
                      ))}
                    </View>
                  )}

                  {stats.systems.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        📦 시스템 ({stats.achievedSystems}개 달성)
                      </Text>
                      {stats.systems.map(({ system, goalTitle, completion, achieved }) => (
                        <CompletionRow
                          key={system.id}
                          title={system.title}
                          subtitle={goalTitle}
                          completion={completion}
                          achieved={achieved}
                        />
                      ))}
                    </View>
                  )}

                  {stats.habits.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        🔄 습관 ({stats.achievedHabits}개 달성)
                      </Text>
                      {stats.habits.map(
                        ({
                          habit,
                          systemTitle,
                          completion,
                          achieved,
                          daysMetTarget,
                          daysRecorded,
                          totalValue,
                        }) => (
                          <CompletionRow
                            key={habit.id}
                            title={habit.title}
                            subtitle={systemTitle}
                            completion={completion}
                            achieved={achieved}
                            extra={
                              daysRecorded > 0
                                ? `목표 달성 ${daysMetTarget}일 · 총 ${totalValue} ${habit.unit}`
                                : '기록 없음'
                            }
                          />
                        )
                      )}
                    </View>
                  )}
                </>
              )}

              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>
                  {hasData ? '멋진 한 해였어요! 🎉' : '확인'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  hero: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textAlign: 'center',
  },
  statSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    paddingVertical: 16,
  },
  section: {
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  highlightCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  highlightAmber: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  highlightEmerald: {
    backgroundColor: colors.emeraldLight,
    borderWidth: 1,
    borderColor: colors.emeraldMid,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
    marginBottom: 2,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  highlightSub: {
    fontSize: 12,
    color: '#d97706',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.zinc100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowExtra: {
    fontSize: 11,
    color: colors.zinc400,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  achievedBadge: {
    backgroundColor: colors.emeraldLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  achievedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emeraldDark,
  },
  rowPct: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
