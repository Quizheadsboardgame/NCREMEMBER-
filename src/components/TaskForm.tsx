import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, CATEGORY_DEFINITIONS } from '../types/task';
import { getTodayString, getTomorrowString, getDaysAheadString, formatTime12h } from '../utils/dateUtils';
import { X, Calendar, Clock, Plus, Check, AlignLeft, Tag } from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: TaskCategory;
    dueDate: string;
    hasTime: boolean;
    dueTime?: string;
  }) => Promise<void>;
  initialTask?: Task | null;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('EX');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [hasTime, setHasTime] = useState(false);
  const [dueTime, setDueTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category);
      setDueDate(initialTask.dueDate);
      setHasTime(initialTask.hasTime);
      setDueTime(initialTask.dueTime || '17:00');
    } else {
      setTitle('');
      setDescription('');
      setCategory('EX');
      setDueDate(getTodayString());
      setHasTime(false);
      setDueTime('17:00');
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }
    if (hasTime && !dueTime) {
      setError('Please select a valid time or disable the time option');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate,
        hasTime,
        dueTime: hasTime ? dueTime : '',
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const categories: TaskCategory[] = ['NC', 'EX', 'ME'];

  const timePresets = [
    { label: '9:00 AM', value: '09:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '3:00 PM', value: '15:00' },
    { label: '6:00 PM', value: '18:00' },
    { label: '8:00 PM', value: '20:00' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-lg">
              {initialTask ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialTask ? 'Edit Task' : 'New Task'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Syncs across all your devices in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Finalize presentation slides"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
            />
          </div>

          {/* Category Selector (NC, EX, ME) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                NC • EX • ME
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((catKey) => {
                const meta = CATEGORY_DEFINITIONS[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${meta.badgeBg} ring-2 ring-indigo-500/50 dark:ring-indigo-400/50 shadow-xs border-transparent`
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-mono text-sm font-extrabold tracking-wider">
                        {meta.code}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{meta.name}</div>
                      <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                        {meta.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Due Date By <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick date presets */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDueDate(getTodayString())}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    dueDate === getTodayString()
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getTomorrowString())}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    dueDate === getTomorrowString()
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getDaysAheadString(3))}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDate(getDaysAheadString(7))}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  In 1 Week
                </button>
              </div>
            </div>
          </div>

          {/* Option to add a time to do by */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="has-time-toggle"
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Option: Add Time to Do By
                </span>
              </label>

              {/* Toggle switch */}
              <button
                type="button"
                id="has-time-toggle"
                role="switch"
                aria-checked={hasTime}
                onClick={() => setHasTime(!hasTime)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  hasTime ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    hasTime ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {hasTime && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {formatTime12h(dueTime)}
                  </div>
                </div>

                {/* Preset times */}
                <div className="flex flex-wrap gap-1.5">
                  {timePresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setDueTime(preset.value)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        dueTime === preset.value
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notes / Description (Optional)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Add any extra context, links, or checklist items..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
