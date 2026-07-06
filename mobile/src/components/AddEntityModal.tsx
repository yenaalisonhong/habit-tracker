import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { colors } from '../theme/colors';
import { currentQuarter, currentYear } from '../utils/dates';

export type EntityType = 'goal' | 'system' | 'habit';
export type EntityModalMode = 'create' | 'edit';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

interface AddEntityModalProps {
  type: EntityType;
  visible: boolean;
  onClose: () => void;
  mode?: EntityModalMode;
  entityId?: string;
  goalId?: string;
  systemId?: string;
}

export default function AddEntityModal({
  type,
  visible,
  onClose,
  mode = 'create',
  entityId,
  goalId,
  systemId,
}: AddEntityModalProps) {
  const {
    addGoal,
    updateGoal,
    addSystem,
    updateSystem,
    addHabit,
    updateHabit,
    goals,
    systems,
    habits,
  } = useTracker();
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState<(typeof QUARTERS)[number]>(currentQuarter());
  const [year, setYear] = useState(String(currentYear()));
  const [selectedGoalId, setSelectedGoalId] = useState(goalId ?? '');
  const [selectedSystemId, setSelectedSystemId] = useState(systemId ?? '');

  useEffect(() => {
    if (!visible) return;

    if (isEdit && entityId) {
      if (type === 'goal') {
        const goal = goals.find((g) => g.id === entityId);
        if (goal) {
          setTitle(goal.title);
          setQuarter(goal.quarter);
          setYear(String(goal.year));
        }
      } else if (type === 'system') {
        const system = systems.find((s) => s.id === entityId);
        if (system) {
          setTitle(system.title);
          setSelectedGoalId(system.goalId);
        }
      } else {
        const habit = habits.find((h) => h.id === entityId);
        if (habit) {
          setTitle(habit.title);
          setSelectedSystemId(habit.systemId);
        }
      }
      return;
    }

    setTitle('');
    setQuarter(currentQuarter());
    setYear(String(currentYear()));
    setSelectedGoalId(goalId ?? goals[0]?.id ?? '');
    setSelectedSystemId(systemId ?? systems[0]?.id ?? '');
  }, [visible, isEdit, entityId, type, goalId, systemId, goals, systems, habits]);

  const config = {
    goal: {
      title: isEdit ? '목표 수정' : '새 목표 추가',
      description: isEdit
        ? '목표 이름, 분기, 연도를 수정하세요.'
        : '분기 목표를 입력하세요.',
    },
    system: {
      title: isEdit ? '시스템 수정' : '새 시스템 추가',
      description: isEdit
        ? '시스템 이름이나 소속 목표를 수정하세요.'
        : '목표를 달성하기 위한 실행 시스템을 입력하세요.',
    },
    habit: {
      title: isEdit ? '습관 수정' : '새 습관 추가',
      description: isEdit
        ? '습관 이름이나 소속 시스템을 수정하세요.'
        : '매일 추적할 습관을 입력하세요.',
    },
  }[type];

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (type === 'goal') {
      const parsedYear = Number(year) || currentYear();
      if (isEdit && entityId) {
        updateGoal(entityId, { title: trimmed, quarter, year: parsedYear });
      } else {
        addGoal({ title: trimmed, quarter, year: parsedYear });
      }
    } else if (type === 'system') {
      const parentGoalId = isEdit ? selectedGoalId : goalId ?? selectedGoalId;
      if (!parentGoalId) return;
      if (isEdit && entityId) {
        updateSystem(entityId, { title: trimmed, goalId: parentGoalId });
      } else {
        addSystem({ title: trimmed, goalId: parentGoalId });
      }
    } else {
      const parentSystemId = isEdit ? selectedSystemId : systemId ?? selectedSystemId;
      if (!parentSystemId) return;
      if (isEdit && entityId) {
        updateHabit(entityId, {
          title: trimmed,
          systemId: parentSystemId,
        });
      } else {
        addHabit({
          title: trimmed,
          systemId: parentSystemId,
          unit: '회',
          target: 1,
        });
      }
    }

    onClose();
  }

  const canSubmit =
    title.trim().length > 0 &&
  !(type === 'system' && !(isEdit ? selectedGoalId : goalId ?? selectedGoalId)) &&
  !(type === 'habit' && !(isEdit ? selectedSystemId : systemId ?? selectedSystemId));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>

            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={
                type === 'goal'
                  ? '예: 건강한 몸 만들기'
                  : type === 'system'
                  ? '예: 운동 루틴'
                  : '예: 유산소 운동'
              }
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {type === 'goal' && (
              <>
                <Text style={styles.label}>분기</Text>
                <View style={styles.chipRow}>
                  {QUARTERS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => setQuarter(q)}
                      style={[styles.chip, quarter === q && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, quarter === q && styles.chipTextActive]}>
                        {q}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>연도</Text>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            {type === 'system' && (isEdit || !goalId) && (
              <>
                <Text style={styles.label}>소속 목표</Text>
                {goals.length === 0 ? (
                  <Text style={styles.hint}>목표를 먼저 추가하세요</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {goals.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => setSelectedGoalId(g.id)}
                        style={[styles.chip, selectedGoalId === g.id && styles.chipActive]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedGoalId === g.id && styles.chipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {g.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            {type === 'habit' && (
              <>
                {(isEdit || !systemId) && (
                  <>
                    <Text style={styles.label}>소속 시스템</Text>
                    {systems.length === 0 ? (
                      <Text style={styles.hint}>시스템을 먼저 추가하세요</Text>
                    ) : (
                      <View style={styles.systemList}>
                        {systems.map((s) => {
                          const goal = goals.find((g) => g.id === s.goalId);
                          return (
                            <Pressable
                              key={s.id}
                              onPress={() => setSelectedSystemId(s.id)}
                              style={[
                                styles.systemOption,
                                selectedSystemId === s.id && styles.systemOptionActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.systemOptionText,
                                  selectedSystemId === s.id && styles.systemOptionTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                {goal ? `${goal.title} › ` : ''}
                                {s.title}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            <View style={styles.buttons}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>{isEdit ? '저장' : '추가'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  systemList: { gap: 6 },
  systemOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  systemOptionActive: { backgroundColor: colors.emeraldLight, borderColor: colors.emerald },
  systemOptionText: { fontSize: 13, color: colors.text },
  systemOptionTextActive: { color: colors.emeraldDark, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: colors.textMuted },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.emerald,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
