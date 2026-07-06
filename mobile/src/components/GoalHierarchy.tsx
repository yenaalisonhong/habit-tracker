import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { Habit } from '../types';
import { colors } from '../theme/colors';
import { completionColor } from '../utils/completion';
import AddEntityModal, { EntityType, EntityModalMode } from './AddEntityModal';
import HabitLogModal from './HabitLogModal';

interface ModalState {
  type: EntityType;
  mode: EntityModalMode;
  entityId?: string;
  goalId?: string;
  systemId?: string;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressFill, { width: `${pct}%`, backgroundColor: completionColor(pct) }]}
      />
    </View>
  );
}

function HabitRow({
  habit,
  completion,
  value,
  target,
  unit,
  hasFriction,
  onLog,
  onEdit,
}: {
  habit: Habit;
  completion: number;
  value: number;
  target: number;
  unit: string;
  hasFriction: boolean;
  onLog: (h: Habit) => void;
  onEdit: (h: Habit) => void;
}) {
  return (
    <Pressable style={styles.habitRow} onPress={() => onLog(habit)}>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor:
              completion >= 80
                ? colors.emerald
                : completion >= 40
                ? colors.yellow
                : completion > 0
                ? colors.orange
                : colors.zinc200,
          },
        ]}
      />
      <View style={styles.habitInfo}>
        <View style={styles.habitHeader}>
          <Text style={styles.habitTitle} numberOfLines={1}>
            {habit.title}
          </Text>
          <Text style={styles.habitValue}>
            {value} / {target} {unit}
          </Text>
        </View>
        <ProgressBar value={completion} />
      </View>
      {hasFriction && value === 0 && <Text style={styles.frictionIcon}>⚠️</Text>}
      <Text style={[styles.habitPct, { color: completionColor(completion) }]}>
        {Math.round(completion)}%
      </Text>
      <Pressable
        onPress={() => onEdit(habit)}
        hitSlop={8}
        style={styles.editBtn}
      >
        <Text style={styles.editBtnText}>✎</Text>
      </Pressable>
    </Pressable>
  );
}

export default function GoalHierarchy() {
  const { goalsWithCompletion } = useTracker();
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [modalHabit, setModalHabit] = useState<Habit | null>(null);
  const [entityModal, setEntityModal] = useState<ModalState | null>(null);

  function openAdd(type: EntityType, ctx?: { goalId?: string; systemId?: string }) {
    setEntityModal({ type, mode: 'create', ...ctx });
    if (ctx?.goalId) {
      setExpandedGoals((prev) => ({ ...prev, [ctx.goalId!]: true }));
    }
    if (ctx?.systemId) {
      setExpandedSystems((prev) => ({ ...prev, [ctx.systemId!]: true }));
    }
  }

  function openEdit(
    type: EntityType,
    entityId: string,
    ctx?: { goalId?: string; systemId?: string }
  ) {
    setEntityModal({ type, mode: 'edit', entityId, ...ctx });
  }

  function toggleGoal(id: string) {
    setExpandedGoals((prev) => ({ ...prev, [id]: !isGoalExpanded(id) }));
  }

  function toggleSystem(id: string) {
    setExpandedSystems((prev) => ({ ...prev, [id]: !isSystemExpanded(id) }));
  }

  const isGoalExpanded = (id: string) => expandedGoals[id] !== false;
  const isSystemExpanded = (id: string) => expandedSystems[id] !== false;

  return (
    <View>
      <View style={styles.header}>
        <Pressable style={styles.addGoalBtn} onPress={() => openAdd('goal')}>
          <Text style={styles.addGoalBtnText}>+ 목표 추가</Text>
        </Pressable>
      </View>

      {goalsWithCompletion.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 목표가 없어요 🥺</Text>
          <Text style={styles.emptySub}>첫 목표를 추가해 보세요!</Text>
          <Pressable style={styles.addGoalBtnLarge} onPress={() => openAdd('goal')}>
            <Text style={styles.addGoalBtnText}>+ 목표 추가</Text>
          </Pressable>
        </View>
      ) : (
        goalsWithCompletion.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Pressable onPress={() => toggleGoal(goal.id)} style={styles.expandBtn}>
                <Text style={styles.expandIcon}>{isGoalExpanded(goal.id) ? '▾' : '▸'}</Text>
              </Pressable>
              <Pressable style={styles.goalInfo} onPress={() => toggleGoal(goal.id)}>
                <View style={styles.goalTitleRow}>
                  <Text style={styles.goalTitle} numberOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text style={styles.goalMeta}>
                    {goal.quarter} {goal.year}
                  </Text>
                  <Text style={[styles.goalPct, { color: completionColor(goal.completion) }]}>
                    {Math.round(goal.completion)}%
                  </Text>
                </View>
                <ProgressBar value={goal.completion} />
              </Pressable>
              <Pressable
                onPress={() => openEdit('goal', goal.id)}
                hitSlop={8}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>✎</Text>
              </Pressable>
            </View>

            {isGoalExpanded(goal.id) && (
              <View style={styles.goalBody}>
                {goal.systems.map((sys) => (
                  <View key={sys.id} style={styles.systemCard}>
                    <View style={styles.systemHeader}>
                      <Pressable onPress={() => toggleSystem(sys.id)} style={styles.expandBtn}>
                        <Text style={styles.expandIcon}>
                          {isSystemExpanded(sys.id) ? '▾' : '▸'}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.systemInfo} onPress={() => toggleSystem(sys.id)}>
                        <View style={styles.systemTitleRow}>
                          <Text style={styles.systemTitle} numberOfLines={1}>
                            {sys.title}
                          </Text>
                          <Text
                            style={[styles.systemPct, { color: completionColor(sys.completion) }]}
                          >
                            {Math.round(sys.completion)}%
                          </Text>
                        </View>
                        <ProgressBar value={sys.completion} />
                      </Pressable>
                      <Pressable
                        onPress={() => openEdit('system', sys.id, { goalId: goal.id })}
                        hitSlop={8}
                        style={styles.editBtn}
                      >
                        <Text style={styles.editBtnText}>✎</Text>
                      </Pressable>
                    </View>

                    {isSystemExpanded(sys.id) && (
                      <View style={styles.habitList}>
                        {sys.habits.map((habit) => (
                          <HabitRow
                            key={habit.id}
                            habit={habit}
                            completion={habit.completion}
                            value={habit.todayLog?.value ?? 0}
                            target={habit.target}
                            unit={habit.unit}
                            hasFriction={!!habit.todayLog?.friction}
                            onLog={setModalHabit}
                            onEdit={(h) => openEdit('habit', h.id, { systemId: sys.id })}
                          />
                        ))}
                        {sys.habits.length === 0 && (
                          <Text style={styles.emptyHabits}>습관 없음</Text>
                        )}
                        <Pressable
                          onPress={() => openAdd('habit', { systemId: sys.id })}
                          style={styles.addLink}
                        >
                          <Text style={styles.addLinkText}>+ 습관 추가</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}

                {goal.systems.length === 0 && (
                  <Text style={styles.emptySystems}>시스템 없음</Text>
                )}
                <Pressable
                  onPress={() => openAdd('system', { goalId: goal.id })}
                  style={styles.addLink}
                >
                  <Text style={styles.addLinkText}>+ 시스템 추가</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      <AddEntityModal
        type={entityModal?.type ?? 'goal'}
        mode={entityModal?.mode ?? 'create'}
        entityId={entityModal?.entityId}
        visible={!!entityModal}
        onClose={() => setEntityModal(null)}
        goalId={entityModal?.goalId}
        systemId={entityModal?.systemId}
      />

      <HabitLogModal
        habit={modalHabit}
        visible={!!modalHabit}
        onClose={() => setModalHabit(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  addGoalBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addGoalBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  expandBtn: { paddingTop: 2 },
  expandIcon: { fontSize: 14, color: colors.textMuted, width: 16 },
  goalInfo: { flex: 1 },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  goalTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  goalMeta: { fontSize: 11, color: colors.textMuted },
  goalPct: { fontSize: 14, fontWeight: '700' },
  goalBody: { marginTop: 12, gap: 8 },
  systemCard: { marginLeft: 8 },
  systemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  systemInfo: { flex: 1 },
  systemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  systemTitle: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  systemPct: { fontSize: 11, fontWeight: '600' },
  habitList: { marginLeft: 12, marginTop: 4 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  habitInfo: { flex: 1 },
  habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitTitle: { fontSize: 13, color: colors.zinc700, flex: 1 },
  habitValue: { fontSize: 11, color: colors.textMuted },
  habitPct: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  frictionIcon: { fontSize: 12 },
  editBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  editBtnText: { fontSize: 14, color: colors.textMuted },
  progressTrack: {
    height: 5,
    backgroundColor: colors.zinc100,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },
  addLink: { marginLeft: 12, marginTop: 4, paddingVertical: 6 },
  addLinkText: { fontSize: 12, color: colors.emerald, fontWeight: '500' },
  emptySystems: { fontSize: 11, color: colors.textMuted, marginLeft: 12 },
  emptyHabits: { fontSize: 11, color: colors.textMuted, marginLeft: 8, paddingVertical: 4 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  emptySub: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  addGoalBtnLarge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
});
