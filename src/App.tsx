import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Task, TaskCategory, CategoryFilter, StatusFilter, DateFilter, CATEGORY_DEFINITIONS } from './types/task';
import {
  subscribeUserTasks,
  createCloudTask,
  updateCloudTask,
  deleteCloudTask,
  getLocalTasks,
  saveLocalTasks,
  migrateLocalTasksToCloud,
} from './services/taskService';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { SyncStatusBadge } from './components/SyncStatusBadge';
import { CategoryBadge } from './components/CategoryBadge';
import { CategoryLegendModal } from './components/CategoryLegendModal';
import { getTodayString, getTomorrowString, formatTime12h } from './utils/dateUtils';
import {
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  Layers,
  Sparkles,
  Smartphone,
  Info,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

function TaskApp() {
  const { user, isOnline } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Quick Add Bar state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('EX');
  const [quickDueDate, setQuickDueDate] = useState(getTodayString());
  const [quickHasTime, setQuickHasTime] = useState(false);
  const [quickDueTime, setQuickDueTime] = useState('17:00');
  const [isAddingQuick, setIsAddingQuick] = useState(false);

  // Load and listen to tasks
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      setLoading(true);
      // Migrate any guest tasks if needed
      migrateLocalTasksToCloud(user.uid).then(() => {
        unsubscribe = subscribeUserTasks(
          user.uid,
          (cloudTasks) => {
            setTasks(cloudTasks);
            setLoading(false);
          },
          (err) => {
            console.error('Subscription error:', err);
            setLoading(false);
          }
        );
      });
    } else {
      // Guest local mode
      const local = getLocalTasks();
      setTasks(local);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Handler: Create or Update Task
  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    category: TaskCategory;
    dueDate: string;
    hasTime: boolean;
    dueTime?: string;
  }) => {
    if (user) {
      if (editingTask) {
        await updateCloudTask(user.uid, editingTask.id, {
          title: data.title,
          description: data.description,
          category: data.category,
          dueDate: data.dueDate,
          hasTime: data.hasTime,
          dueTime: data.dueTime,
        });
      } else {
        await createCloudTask(user.uid, data);
      }
    } else {
      // Local storage mode
      const now = new Date().toISOString();
      if (editingTask) {
        const updated = tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...data,
                dueTime: data.hasTime ? data.dueTime : '',
                updatedAt: now,
              }
            : t
        );
        setTasks(updated);
        saveLocalTasks(updated);
      } else {
        const newTask: Task = {
          id: 'local_' + Date.now().toString(36),
          userId: 'guest',
          title: data.title,
          description: data.description,
          category: data.category,
          dueDate: data.dueDate,
          hasTime: data.hasTime,
          dueTime: data.hasTime ? data.dueTime : '',
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [newTask, ...tasks];
        setTasks(updated);
        saveLocalTasks(updated);
      }
    }
  };

  // Handler: Quick Add Submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      setIsAddingQuick(true);
      await handleSaveTask({
        title: quickTitle.trim(),
        category: quickCategory,
        dueDate: quickDueDate,
        hasTime: quickHasTime,
        dueTime: quickHasTime ? quickDueTime : '',
      });
      setQuickTitle('');
      setQuickHasTime(false);
    } catch (err) {
      console.error('Quick add failed:', err);
    } finally {
      setIsAddingQuick(false);
    }
  };

  // Handler: Toggle Completed
  const handleToggleComplete = async (task: Task) => {
    const nextCompleted = !task.completed;
    const now = new Date().toISOString();

    if (user) {
      await updateCloudTask(user.uid, task.id, {
        completed: nextCompleted,
        completedAt: nextCompleted ? now : '',
      });
    } else {
      const updated = tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? now : '',
              updatedAt: now,
            }
          : t
      );
      setTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Handler: Change Category directly from item
  const handleChangeCategory = async (taskId: string, newCategory: TaskCategory) => {
    if (user) {
      await updateCloudTask(user.uid, taskId, {
        category: newCategory,
      });
    } else {
      const updated = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              category: newCategory,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      setTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Handler: Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (user) {
      await deleteCloudTask(user.uid, taskId);
    } else {
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Handler: Clear All Completed Tasks
  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (!completedTasks.length) return;

    if (user) {
      for (const t of completedTasks) {
        await deleteCloudTask(user.uid, t.id);
      }
    } else {
      const updated = tasks.filter((t) => !t.completed);
      setTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Counts and Metrics
  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const ncCount = tasks.filter((t) => t.category === 'NC').length;
    const exCount = tasks.filter((t) => t.category === 'EX').length;
    const meCount = tasks.filter((t) => t.category === 'ME').length;

    const todayStr = getTodayString();
    const overdueCount = tasks.filter((t) => !t.completed && t.dueDate < todayStr).length;
    const todayCount = tasks.filter((t) => !t.completed && t.dueDate === todayStr).length;

    return {
      total,
      completed,
      active,
      NC: ncCount,
      EX: exCount,
      ME: meCount,
      overdue: overdueCount,
      today: todayCount,
    };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const todayStr = getTodayString();

    return tasks.filter((task) => {
      // Category filter (ALL, NC, EX, ME)
      if (activeCategory !== 'ALL' && task.category !== activeCategory) {
        return false;
      }

      // Status filter (all, active, completed)
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      // Date filter
      if (dateFilter === 'today' && task.dueDate !== todayStr) return false;
      if (dateFilter === 'overdue' && (task.completed || task.dueDate >= todayStr)) return false;
      if (dateFilter === 'upcoming' && task.dueDate <= todayStr) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesCategory = task.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    });
  }, [tasks, activeCategory, statusFilter, dateFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Category helper */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  SyncTasks
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Cloud Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Multi-device list with NC • EX • ME categories & precision time
              </p>
            </div>

            <button
              onClick={() => setIsLegendOpen(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Learn about NC, EX, ME categories"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Sync & Profile Status */}
          <SyncStatusBadge />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Device Sync Info Banner if not signed in */}
        {!user && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-amber-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Want this list on your phone and laptop simultaneously?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Sign in with Google to enable real-time multi-device sync across all your phones, tablets, and computers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                100% Free Cloud Sync
              </span>
            </div>
          </div>
        )}

        {/* Quick Add Bar */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <form onSubmit={handleQuickAdd} className="space-y-3.5">
            {/* Main Input Line */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Add a new task (e.g., Client sync call, Review quarterly report)..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Detailed Task Form Modal Trigger */}
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsFormOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                title="Open detailed task form with notes and presets"
              >
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Full Form</span>
              </button>

              <button
                type="submit"
                disabled={!quickTitle.trim() || isAddingQuick}
                className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Quick Settings row: Category (NC, EX, ME) + Due Date + Optional Due Time */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              {/* Category selector chips */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mr-1 hidden xs:inline">
                  Category:
                </span>
                {(['NC', 'EX', 'ME'] as TaskCategory[]).map((cat) => {
                  const isSelected = quickCategory === cat;
                  const meta = CATEGORY_DEFINITIONS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuickCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs transition-all border ${
                        isSelected
                          ? `${meta.badgeBg} ring-2 ring-indigo-500/40 shadow-2xs`
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                      title={`${meta.code}: ${meta.name}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Date & Time options */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Due Date Input */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="bg-transparent text-slate-700 dark:text-slate-300 text-xs focus:outline-hidden"
                  />
                </div>

                {/* Option to add time toggle */}
                <button
                  type="button"
                  onClick={() => setQuickHasTime(!quickHasTime)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                    quickHasTime
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle option to specify due time"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{quickHasTime ? formatTime12h(quickDueTime) : '+ Add Time'}</span>
                </button>

                {quickHasTime && (
                  <input
                    type="time"
                    value={quickDueTime}
                    onChange={(e) => setQuickDueTime(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-hidden"
                  />
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Filter and Category Navigation */}
        <section className="space-y-3">
          {/* Category Tabs: ALL | NC | EX | ME */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
              {/* ALL */}
              <button
                type="button"
                onClick={() => setActiveCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>ALL</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeCategory === 'ALL'
                      ? 'bg-indigo-700/60 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {counts.total}
                </span>
              </button>

              {/* NC */}
              <button
                type="button"
                onClick={() => setActiveCategory('NC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === 'NC'
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 shadow-xs ring-1 ring-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="font-mono">NC</span>
                <span className="hidden sm:inline font-sans text-[11px] font-normal opacity-80">
                  Non-Critical
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {counts.NC}
                </span>
              </button>

              {/* EX */}
              <button
                type="button"
                onClick={() => setActiveCategory('EX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === 'EX'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 shadow-xs ring-1 ring-amber-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="font-mono">EX</span>
                <span className="hidden sm:inline font-sans text-[11px] font-normal opacity-80">
                  Execution
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {counts.EX}
                </span>
              </button>

              {/* ME */}
              <button
                type="button"
                onClick={() => setActiveCategory('ME')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === 'ME'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="font-mono">ME</span>
                <span className="hidden sm:inline font-sans text-[11px] font-normal opacity-80">
                  Meeting & Events
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {counts.ME}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Subfilters: Status (All, Active, Completed) + Date (All, Today, Overdue, Upcoming) */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
            {/* Status Pills */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Status:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  statusFilter === 'active'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Active ({counts.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2 py-0.5 rounded-md font-semibold ${
                  statusFilter === 'completed'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                Done ({counts.completed})
              </button>
            </div>

            {/* Date filter chips */}
            <div className="flex items-center gap-1.5">
              {counts.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => setDateFilter(dateFilter === 'overdue' ? 'all' : 'overdue')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border ${
                    dateFilter === 'overdue'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{counts.overdue} Overdue</span>
                </button>
              )}

              {counts.today > 0 && (
                <button
                  type="button"
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border ${
                    dateFilter === 'today'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{counts.today} Today</span>
                </button>
              )}

              {dateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline ml-1"
                >
                  Clear date filter
                </button>
              )}

              {counts.completed > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-2"
                  title="Remove all completed tasks"
                >
                  Clear done ({counts.completed})
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Task List */}
        <section className="space-y-2.5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Syncing tasks across your devices...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {searchQuery || activeCategory !== 'ALL' || dateFilter !== 'all' || statusFilter !== 'all'
                    ? 'No matching tasks found'
                    : 'All tasks completed!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {searchQuery || activeCategory !== 'ALL' || dateFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try clearing the search or category filter to view more items.'
                    : 'Add a new task with NC, EX, or ME category, set a due date, and sync it live across all your devices.'}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteTask}
                onChangeCategory={handleChangeCategory}
              />
            ))
          )}
        </section>

        {/* Progress summary bar */}
        {counts.total > 0 && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Progress: {counts.completed} of {counts.total} completed ({Math.round((counts.completed / counts.total) * 100)}%)
              </span>
              <div className="flex-1 sm:w-36 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(counts.completed / counts.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> NC: {counts.NC}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> EX: {counts.EX}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ME: {counts.ME}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
      />

      {/* Category Legend & Guide Modal */}
      <CategoryLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskApp />
    </AuthProvider>
  );
}
