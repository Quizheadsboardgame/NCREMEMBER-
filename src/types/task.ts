export type TaskCategory = 'NC' | 'EX' | 'ME';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  hasTime: boolean;
  dueTime?: string; // HH:mm (24-hour format)
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFilter = 'ALL' | TaskCategory;
export type StatusFilter = 'all' | 'active' | 'completed';
export type DateFilter = 'all' | 'today' | 'overdue' | 'upcoming';

export interface CategoryMeta {
  code: TaskCategory;
  name: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  accentClass: string;
  dotColor: string;
}

export const CATEGORY_DEFINITIONS: Record<TaskCategory, CategoryMeta> = {
  NC: {
    code: 'NC',
    name: 'Non-Critical',
    subtitle: 'Routine & maintenance tasks that can be paced',
    badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    borderClass: 'border-l-indigo-500',
    accentClass: 'text-indigo-600 bg-indigo-500/10',
    dotColor: 'bg-indigo-500',
  },
  EX: {
    code: 'EX',
    name: 'Execution',
    subtitle: 'High-focus action items demanding deep execution',
    badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-l-amber-500',
    accentClass: 'text-amber-600 bg-amber-500/10',
    dotColor: 'bg-amber-500',
  },
  ME: {
    code: 'ME',
    name: 'Meeting & Events',
    subtitle: 'Time-bound conversations, calls, and synchronized syncs',
    badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    borderClass: 'border-l-emerald-500',
    accentClass: 'text-emerald-600 bg-emerald-500/10',
    dotColor: 'bg-emerald-500',
  },
};
