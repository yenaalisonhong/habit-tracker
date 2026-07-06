import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { FrictionType, FRICTION_OPTIONS, FRICTION_EMOJIS } from '../types';
import { colors } from '../theme/colors';
import {
  generateDateRange,
  formatShortDate,
  getDayLabel,
  isRecordableDate,
} from '../utils/dates';
import {
  HABIT_STAGES,
  HabitLogStage,
  stageFromValue,
  valueFromStage,
} from '../utils/habitStages';

interface LogInputModal {
  habitId: string;
  habitTitle: string;
  date: string;
  unit: string;
  target: number;
}

function getCellStyle(completion: number, hasFriction: boolean) {
  if (completion === 0) {
    return hasFriction
      ? { backgroundColor: colors.roseLight, borderColor: '#fda4af', borderWidth: 1 }
      : { backgroundColor: colors.zinc100 };
  }
  if (completion < 40) return { backgroundColor: colors.primaryLight };
  if (completion < 80) return { backgroundColor: colors.primaryMid };
  return { backgroundColor: colors.primaryDark };
}

const DAYS_TO_SHOW = 14;

export default function IntensityGrid() {
  const {
    goals, getSystemsByGoal, getHabitsBySystem, getHabitCompletion,
    getLogByHabitAndDate, upsertLog, updateFriction, habits, todayDate,
  } = useTracker();

  const [logModal, setLogModal] = useState<LogInputModal | null>(null);
  const [frictionModal, setFrictionModal] = useState<{ habitId: string; date: string } | null>(null);
  const [selectedStage, setSelectedStage] = useState<HabitLogStage | null>(null);
  const [selectedFriction, setSelectedFriction] = useState<FrictionType | null>(null);

  const dates = generateDateRange(DAYS_TO_SHOW);
  const today = todayDate;

  const openLogModal = useCallback(
    (habitId: string, date: string) => {
      if (!isRecordableDate(date, todayDate)) return;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const log = getLogByHabitAndDate(habitId, date);
      setLogModal({ habitId, habitTitle: habit.title, date, unit: habit.unit, target: habit.target });
      setSelectedStage(log ? stageFromValue(log.value ?? 0, habit.target) : null);
      setSelectedFriction(log?.friction ?? null);
      setFrictionModal(null);
    },
    [habits, getLogByHabitAndDate, todayDate]
  );

  const handleLongPress = useCallback(
    (habitId: string, date: string) => {
      if (!isRecordableDate(date, todayDate)) return;
      const completion = getHabitCompletion(habitId, date);
      if (completion === 0) {
        Alert.alert('0% 달성일', '옵션을 선택하세요', [
          { text: '실적 입력', onPress: () => openLogModal(habitId, date) },
          { text: '실패 원인 기록', onPress: () => setFrictionModal({ habitId, date }) },
          { text: '취소', style: 'cancel' },
        ]);
      }
    },
    [getHabitCompletion, openLogModal, todayDate]
  );

  const handleSaveLog = useCallback(() => {
    if (!logModal || !selectedStage) return;
    const val = valueFromStage(selectedStage, logModal.target);
    const friction = val === 0 ? (selectedFriction ?? undefined) : undefined;
    upsertLog({ habitId: logModal.habitId, date: logModal.date, value: val, friction });
    setLogModal(null);
  }, [logModal, selectedStage, selectedFriction, upsertLog]);

  const handleSelectFriction = useCallback(
    (friction: FrictionType) => {
      if (!frictionModal) return;
      updateFriction(frictionModal.habitId, frictionModal.date, friction);
      setFrictionModal(null);
    },
    [frictionModal, updateFriction]
  );

  const showFrictionInModal = logModal && selectedStage === 'fail';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>☁️ 습관 강도 그리드</Text>
        <Text style={styles.subtitle}>최근 {DAYS_TO_SHOW}일 · 탭하여 값 입력</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <View style={styles.habitHeaderCell}>
              <Text style={styles.headerLabel}>습관</Text>
            </View>
            {dates.map((date) => {
              const isToday = date === today;
              const dayLabel = getDayLabel(date);
              const isSun = dayLabel === '일';
              const isSat = dayLabel === '토';
              const recordable = isRecordableDate(date, today);
              return (
                <View key={date} style={styles.dateHeaderCell}>
                  <Text style={[styles.dayText, isToday && styles.todayText, isSun && styles.sunText, isSat && styles.satText, !recordable && styles.preTrackingText]}>
                    {dayLabel}
                  </Text>
                  <Text style={[styles.dateText, isToday && styles.todayText, !recordable && styles.preTrackingText]}>{formatShortDate(date)}</Text>
                </View>
              );
            })}
          </View>

          {goals.map((goal) => {
            const goalSystems = getSystemsByGoal(goal.id);
            return (
              <View key={goal.id}>
                <View style={styles.goalRow}>
                  <Text style={styles.goalLabel}>🎯 {goal.title}</Text>
                </View>
                {goalSystems.map((system) => {
                  const systemHabits = getHabitsBySystem(system.id);
                  return (
                    <View key={system.id}>
                      <View style={styles.systemRow}>
                        <Text style={styles.systemLabel}>↳ {system.title}</Text>
                      </View>
                      {systemHabits.map((habit) => (
                        <View key={habit.id} style={styles.row}>
                          <View style={styles.habitCell}>
                            <Text style={styles.habitTitle} numberOfLines={1}>{habit.title}</Text>
                            <Text style={styles.habitMeta}>{habit.unit} / {habit.target}</Text>
                          </View>
                          {dates.map((date) => {
                            const completion = getHabitCompletion(habit.id, date);
                            const log = getLogByHabitAndDate(habit.id, date);
                            const hasFriction = completion === 0 && !!log?.friction;
                            const cellStyle = getCellStyle(completion, hasFriction);
                            const recordable = isRecordableDate(date, today);

                            return (
                              <Pressable
                                key={date}
                                onPress={() => recordable && openLogModal(habit.id, date)}
                                onLongPress={() => recordable && handleLongPress(habit.id, date)}
                                style={[styles.cell, cellStyle, !recordable && styles.cellDisabled]}
                                disabled={!recordable}
                              >
                                {hasFriction && <View style={styles.frictionDot} />}
                                {completion > 0 && (
                                  <Text style={styles.cellText}>{Math.round(completion)}</Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <LegendItem color={colors.zinc100} label="없음" />
        <LegendItem color={colors.primaryLight} label="낮음 (1–39%)" />
        <LegendItem color={colors.primaryMid} label="중간 (40–79%)" />
        <LegendItem color={colors.primary} label="높음 (80%+)" />
        <LegendItem color={colors.zinc100} label="방해 요인 기록" dot="#fbbf24" />
      </View>

      {/* Log Input Modal */}
      <Modal visible={!!logModal} transparent animationType="fade" onRequestClose={() => setLogModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLogModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {logModal && (
              <>
                <Text style={styles.modalTitle}>{logModal.habitTitle}</Text>
                <Text style={styles.modalSubtitle}>
                  {logModal.date} · 목표: {logModal.target} {logModal.unit}
                </Text>
                <Text style={styles.inputLabel}>오늘 달성 상태</Text>
                <View style={styles.stageRow}>
                  {HABIT_STAGES.map(({ key, symbol, label }) => {
                    const isActive = selectedStage === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setSelectedStage(key);
                          if (key !== 'fail') setSelectedFriction(null);
                        }}
                        style={[
                          styles.stageBtn,
                          isActive && key === 'fail' && styles.stageBtnFail,
                          isActive && key === 'partial' && styles.stageBtnPartial,
                          isActive && key === 'complete' && styles.stageBtnComplete,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageSymbol,
                            isActive && key === 'fail' && styles.stageSymbolFail,
                            isActive && key === 'partial' && styles.stageSymbolPartial,
                            isActive && key === 'complete' && styles.stageSymbolComplete,
                          ]}
                        >
                          {symbol}
                        </Text>
                        <Text style={[styles.stageLabel, isActive && styles.stageLabelActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {showFrictionInModal && (
                  <View style={styles.frictionSection}>
                    <Text style={styles.inputLabel}>📌 실패 원인 (선택)</Text>
                    <View style={styles.frictionChips}>
                      {FRICTION_OPTIONS.map((f) => (
                        <Pressable
                          key={f}
                          onPress={() => setSelectedFriction(selectedFriction === f ? null : f)}
                          style={[styles.chip, selectedFriction === f && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, selectedFriction === f && styles.chipTextActive]}>
                            {FRICTION_EMOJIS[f]} {f}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.modalButtons}>
                  <Pressable style={styles.cancelBtn} onPress={() => setLogModal(null)}>
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, !selectedStage && styles.saveBtnDisabled]}
                    onPress={handleSaveLog}
                    disabled={!selectedStage}
                  >
                    <Text style={styles.saveBtnText}>저장</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Friction Modal */}
      <Modal visible={!!frictionModal} transparent animationType="fade" onRequestClose={() => setFrictionModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFrictionModal(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>실패 원인 선택</Text>
            {FRICTION_OPTIONS.map((f) => (
              <Pressable key={f} style={styles.frictionOption} onPress={() => handleSelectFriction(f)}>
                <Text style={styles.frictionOptionText}>{FRICTION_EMOJIS[f]} {f}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]}>
        {dot ? <View style={[styles.legendDot, { backgroundColor: dot }]} /> : null}
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = 32;
const HABIT_WIDTH = 110;

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  habitHeaderCell: { width: HABIT_WIDTH, paddingVertical: 8, paddingHorizontal: 8 },
  headerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  dateHeaderCell: { width: CELL_SIZE + 4, alignItems: 'center', paddingVertical: 4 },
  dayText: { fontSize: 9, color: colors.textMuted },
  dateText: { fontSize: 9, color: colors.textMuted },
  todayText: { color: colors.emerald, fontWeight: '700' },
  sunText: { color: '#fb7185' },
  satText: { color: '#60a5fa' },
  goalRow: { backgroundColor: colors.zinc100, paddingVertical: 6, paddingHorizontal: 8 },
  goalLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  systemRow: { backgroundColor: '#fafafa', paddingVertical: 4, paddingHorizontal: 12 },
  systemLabel: { fontSize: 10, color: colors.textMuted },
  habitCell: { width: HABIT_WIDTH, paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: colors.zinc100 },
  habitTitle: { fontSize: 13, fontWeight: '500', color: colors.zinc700 },
  habitMeta: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDisabled: { opacity: 0.35 },
  preTrackingText: { opacity: 0.4 },
  cellText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  frictionDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.rose,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3, position: 'relative' },
  legendDot: { position: 'absolute', top: 0, right: 0, width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, width: '100%', maxWidth: 360, borderWidth: 2, borderColor: colors.border },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: colors.zinc700, marginBottom: 6 },
  stageRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stageBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  stageBtnFail: { borderColor: colors.rose, backgroundColor: '#fff1f2' },
  stageBtnPartial: { borderColor: colors.yellow, backgroundColor: '#fffbeb' },
  stageBtnComplete: { borderColor: colors.emerald, backgroundColor: colors.emeraldLight },
  stageSymbol: { fontSize: 28, lineHeight: 32, color: colors.textMuted },
  stageSymbolFail: { color: colors.rose },
  stageSymbolPartial: { color: '#ca8a04' },
  stageSymbolComplete: { color: colors.emerald },
  stageLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  stageLabelActive: { fontWeight: '600', color: colors.text },
  frictionSection: { marginTop: 8 },
  frictionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.rose, borderColor: colors.rose },
  chipText: { fontSize: 11, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: colors.textMuted },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  frictionOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.zinc100 },
  frictionOptionText: { fontSize: 15, color: colors.text },
});
