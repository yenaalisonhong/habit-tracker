import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { Habit, FrictionType, FRICTION_OPTIONS, FRICTION_EMOJIS } from '../types';
import { colors } from '../theme/colors';
import {
  HABIT_STAGES,
  HabitLogStage,
  stageFromValue,
  valueFromStage,
} from '../utils/habitStages';

interface HabitLogModalProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
  date?: string;
}

export default function HabitLogModal({ habit, visible, onClose, date }: HabitLogModalProps) {
  const { upsertLog, getLogByHabitAndDate, todayDate } = useTracker();
  const logDate = date ?? todayDate;

  const [selectedStage, setSelectedStage] = useState<HabitLogStage | null>(null);
  const [selectedFriction, setSelectedFriction] = useState<FrictionType | null>(null);

  useEffect(() => {
    if (!visible || !habit) return;
    const existing = getLogByHabitAndDate(habit.id, logDate);
    setSelectedStage(
      existing ? stageFromValue(existing.value ?? 0, habit.target) : null
    );
    setSelectedFriction(existing?.friction ?? null);
  }, [visible, habit, logDate, getLogByHabitAndDate]);

  if (!habit) return null;

  const showFriction = selectedStage === 'fail';

  function handleSave() {
    if (!habit || !selectedStage) return;
    const value = valueFromStage(selectedStage, habit.target);
    upsertLog({
      habitId: habit.id,
      date: logDate,
      value,
      friction: value === 0 ? (selectedFriction ?? undefined) : undefined,
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{habit.title}</Text>
          <Text style={styles.subtitle}>
            {logDate} · 목표: {habit.target} {habit.unit}
          </Text>

          <Text style={styles.label}>오늘 달성 상태</Text>
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

          {showFriction && (
            <View style={styles.frictionSection}>
              <Text style={styles.label}>실패 원인 (선택)</Text>
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

          <View style={styles.buttons}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, !selectedStage && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!selectedStage}
            >
              <Text style={styles.saveBtnText}>저장</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: colors.zinc700, marginBottom: 6 },
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
  frictionSection: { marginTop: 4 },
  frictionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.rose, borderColor: colors.rose },
  chipText: { fontSize: 11, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: colors.textMuted },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.emerald,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
