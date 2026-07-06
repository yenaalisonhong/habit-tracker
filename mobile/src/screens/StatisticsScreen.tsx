import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useTracker } from '../context/TrackerContext';
import CompletionCharts from '../components/CompletionCharts';
import PeriodChart, { ChartPeriod } from '../components/PeriodChart';
import FrictionAnalysis from '../components/FrictionAnalysis';
import YearWrappedModal from '../components/YearWrappedModal';
import { colors } from '../theme/colors';
import { currentYear } from '../utils/dates';

type StatsPeriod = 'daily' | ChartPeriod;

const PERIOD_TABS: { key: StatsPeriod; label: string }[] = [
  { key: 'daily', label: '일별' },
  { key: 'weekly', label: '주별' },
  { key: 'monthly', label: '월별' },
  { key: 'yearly', label: '연별' },
];

export default function StatisticsScreen() {
  const { hydrated, resetAllData } = useTracker();
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [period, setPeriod] = useState<StatsPeriod>('daily');
  const year = currentYear();

  function handleReset() {
    Alert.alert(
      '데이터 초기화',
      '목표, 시스템, 습관, 기록이 모두 삭제됩니다. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => resetAllData(),
        },
      ]
    );
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>통계 & 회고</Text>
          <Text style={styles.subtitle}>달성률 추이와 실패 원인을 분석해 다음 분기를 준비하세요.</Text>
        </View>

        <Pressable style={styles.wrappedBtn} onPress={() => setWrappedOpen(true)}>
          <Text style={styles.wrappedBtnEmoji}>✨</Text>
          <View style={styles.wrappedBtnText}>
            <Text style={styles.wrappedBtnTitle}>YEAR {year} WRAPPED</Text>
            <Text style={styles.wrappedBtnSub}>올해 목표 · 시스템 · 습관 요약 보기</Text>
          </View>
          <Text style={styles.wrappedBtnArrow}>›</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodTabs}>
          {PERIOD_TABS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              style={[styles.periodTab, period === key && styles.periodTabActive]}
            >
              <Text style={[styles.periodTabText, period === key && styles.periodTabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {period === 'daily' ? (
          <>
            <CompletionCharts />
            <View style={styles.divider} />
            <FrictionAnalysis />
          </>
        ) : (
          <PeriodChart period={period} />
        )}

        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>🗑️ 모든 데이터 초기화</Text>
          <Text style={styles.resetBtnSub}>목표·습관·기록을 지우고 새로 시작합니다</Text>
        </Pressable>
      </ScrollView>

      <YearWrappedModal year={year} visible={wrappedOpen} onClose={() => setWrappedOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  wrappedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  wrappedBtnEmoji: { fontSize: 22 },
  wrappedBtnText: { flex: 1 },
  wrappedBtnTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  wrappedBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  wrappedBtnArrow: { fontSize: 22, color: '#fff', fontWeight: '300' },
  periodTabs: { marginBottom: 16, flexGrow: 0 },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodTabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  periodTabTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  resetBtn: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.rose,
    backgroundColor: colors.roseLight,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: colors.rose },
  resetBtnSub: { fontSize: 11, color: '#be123c', marginTop: 4 },
});
