import React from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTracker } from '../context/TrackerContext';
import IntensityGrid from '../components/IntensityGrid';
import GoalHierarchy from '../components/GoalHierarchy';
import GoalProgressPanel from '../components/GoalProgressPanel';
import { colors } from '../theme/colors';

export default function DashboardScreen() {
  const { hydrated } = useTracker();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.quoteBlock}>
        <Text style={styles.quote}>
          „In jedem Anfang wohnt ein Zauber, der uns beschützt und der uns hilft, zu leben.“
        </Text>
        <Text style={styles.quoteAuthor}>— Hermann Hesse</Text>
      </View>

      <GoalProgressPanel />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌸 목표 계층 구조</Text>
        <GoalHierarchy />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💕 14일 강도 히트맵</Text>
        <IntensityGrid />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  quoteBlock: { marginBottom: 16, borderLeftWidth: 2, borderLeftColor: colors.primaryLight, paddingLeft: 12 },
  quote: { fontSize: 14, fontWeight: '500', color: colors.textMuted, fontStyle: 'italic', lineHeight: 22 },
  quoteAuthor: { marginTop: 6, fontSize: 12, color: colors.textMuted, opacity: 0.7 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});

