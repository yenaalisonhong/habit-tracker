# Habit Tracker Project Architecture Specification
## Target Stack: Next.js (App Router), Tailwind CSS, Shadcn UI, Recharts, LocalStorage

This document provides the foundational architecture, relational data models, and component hierarchies for the 'Goal -> System -> Habit' tracker with cascading completions, habit intensities, and friction block logging.

---

## 1. Data Models & Relationship Schema (TypeScript Interfaces)

```typescript
// 1. Quarterly Goals
export interface Goal {
  id: string;
  title: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  createdAt: string;
}

// 2. Systems (Strategies to achieve Goals)
export interface System {
  id: string;
  goalId: string; // Belongs to a Goal
  title: string;
  createdAt: string;
}

// 3. Habits (Actionable daily metrics mapped to a System)
export interface Habit {
  id: string;
  systemId: string; // Belongs to a System
  title: string;
  unit: string;     // e.g., 'minutes', 'pages', 'times'
  target: number;   // Daily target amount (e.g., 60 for 60 mins)
  createdAt: string;
}

// 4. Daily Logs (Tracks intensity and entry details per habit per day)
export interface DailyLog {
  id: string;
  habitId: string;
  date: string;     // Format: 'YYYY-MM-DD'
  value: number;    // Actual achieved amount (0 <= value <= habit.target)
  friction?: 'Overtime' | 'Fatigue' | 'Sudden Appointment' | 'Lack of Will' | 'Other'; // Required if value === 0
}
```

---

## 2. Calculated States & Cascading Logic (Business Logic)

### Habit Level Completion

$$\text{Habit Completion Rate (\%)} = \min\left(\frac{\text{DailyLog.value}}{\text{Habit.target}} \times 100, 100\right)$$

### System Level Completion (Cascaded)

A System's status for a given period is the mathematical average of all its underlying Habits' completion rates.

$$\text{System Completion (\%)} = \frac{\sum_{i=1}^{n} \text{Habit}_i \text{ Completion Rate}}{n}$$

### Goal Level Completion (Cascaded Master)

A Goal's macro progression metrics are computed as the mathematical average of all associated Systems' aggregate metrics.

$$\text{Goal Progress (\%)} = \frac{\sum_{j=1}^{m} \text{System}_j \text{ Progress}}{m}$$

---

## 3. Directory Layout & Component Hierarchy

```text
src/
├── app/
│   ├── layout.tsx             # Root layout with theme-providers
│   ├── page.tsx               # Primary Dashboard (Main Overview Grid)
│   └── statistics/
│       └── page.tsx           # Recharts analytic visualization metrics
├── components/
│   ├── dashboard/
│   │   ├── GoalHierarchy.tsx  # Tree visualizer for Goal -> System -> Habit with progress bars
│   │   └── IntensityGrid.tsx  # GitHub-style 4-tier intensity grid view
│   ├── statistics/
│   │   ├── CompletionCharts.tsx # Weekly/Monthly/Quarterly line & bar trends
│   │   └── FrictionAnalysis.tsx # PieChart visualizing failure modes & text summaries
│   └── ui/                     # Shadcn UI atoms (Dialog, Popover, Progress, Card)
├── context/
│   └── TrackerContext.tsx     # Global State Management with LocalStorage persistent sync
└── hooks/
    └── useTracker.ts          # Custom state hooks for updates and calculations
```

---

## 4. Component Technical Specifications

### A. IntensityGrid Component

- **Grid Layout**: X-axis lists dates sequentially; Y-axis aggregates granular Habits grouped by parent Systems.
- **Color Matrix (Tailwind Tokens)**:
  - `0% / Friction logged`: `bg-zinc-100 dark:bg-zinc-800` (Displays small alert dot if friction is logged)
  - `1% – 39% (Low Intensity)`: `bg-emerald-200 dark:bg-emerald-900`
  - `40% – 79% (Medium Intensity)`: `bg-emerald-400 dark:bg-emerald-600`
  - `80% – 100% (High Intensity)`: `bg-emerald-600 dark:bg-emerald-400`
- **Interactivity**:
  - **Click Event**: Launches Modal/Popover with a numeric input field for `DailyLog.value`.
  - **Friction Context**: If the entered value is `0`, dynamically renders a dropdown selector for the `Friction` enum.

### B. FrictionAnalysis Component

- **Visuals**: Recharts `PieChart` extracting aggregated counts of `DailyLog.friction`.
- **Heuristic Evaluation Block**: Computes the modal value (highest frequency indicator) and generates a dynamic recommendation banner:
  - *IF "Overtime" dominates*: "Your highest friction point is Overtime. We recommend shifting these habits to an early morning block."
  - *IF "Fatigue" dominates*: "Your highest friction point is Fatigue. Consider lowering your daily habit target value to reduce resistance."
  - *IF "Sudden Appointment" dominates*: "Your schedule is frequently disrupted. Consider building buffer time or setting flexible habit windows."
  - *IF "Lack of Will" dominates*: "Motivational friction is high. Try habit stacking or reducing the minimum threshold to build consistency."

---

## 5. Global State & Persistence (TrackerContext)

```typescript
// context/TrackerContext.tsx — shape reference
interface TrackerContextValue {
  goals: Goal[];
  systems: System[];
  habits: Habit[];
  logs: DailyLog[];

  // CRUD actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  addSystem: (system: Omit<System, 'id' | 'createdAt'>) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  upsertLog: (log: Omit<DailyLog, 'id'>) => void;

  // Derived selectors
  getSystemsByGoal: (goalId: string) => System[];
  getHabitsBySystem: (systemId: string) => Habit[];
  getLogsByHabitAndDate: (habitId: string, date: string) => DailyLog | undefined;
  getHabitCompletion: (habitId: string, date: string) => number; // 0–100
  getSystemCompletion: (systemId: string, date: string) => number;
  getGoalProgress: (goalId: string, dateRange: { from: string; to: string }) => number;
}
```

- **Persistence**: All state arrays are synced to `localStorage` via `useEffect` on every mutation.
- **Hydration**: On mount, the context reads from `localStorage` and falls back to empty arrays.

---

## 6. Data Relationship Map

```
Goal (1)
 └── System (N)          [System.goalId → Goal.id]
      └── Habit (N)      [Habit.systemId → System.id]
           └── DailyLog (N per day)  [DailyLog.habitId → Habit.id]
```

Completion percentages cascade **bottom-up**:
`DailyLog.value` → `Habit completion` → `System completion` → `Goal progress`
