import React, { useState } from 'react';
import { Task, TaskCategory, CATEGORY_DEFINITIONS } from '../types/task';
import { CategoryBadge } from './CategoryBadge';
import { getDueStatus, formatTime12h, formatDateFriendly } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeCategory: (taskId: string, category: TaskCategory) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onChangeCategory,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const dueStatus = getDueStatus(task.dueDate, task.hasTime, task.dueTime, task.completed);
  const categoryMeta = CATEGORY_DEFINITIONS[task.category] || CATEGORY_DEFINITIONS.NC;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
          },
          colors: ['#4f46e5', '#f59e0b', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
    onToggleComplete(task);
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
      } ${categoryMeta.borderClass} border-l-4`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-hidden"
          title={task.completed ? 'Mark incomplete' : 'Mark completed'}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
          ) : (
            <Circle className="w-5 h-5 group-hover:scale-105 transition-transform" />
          )}
        </button>

        {/* Main task info */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Category Badge with quick switcher popover */}
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="focus:outline-hidden cursor-pointer"
                title="Click to change category (NC, EX, ME)"
              >
                <CategoryBadge category={task.category} size="sm" />
              </button>

              {showCategoryMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCategoryMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 min-w-[170px] space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Category
                    </div>
                    {(['NC', 'EX', 'ME'] as TaskCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onChangeCategory(task.id, cat);
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          task.category === cat
                            ? 'bg-slate-100 dark:bg-slate-700 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <CategoryBadge category={cat} size="sm" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {CATEGORY_DEFINITIONS[cat].name}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Due date badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                dueStatus.isOverdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 font-bold'
                  : dueStatus.isToday
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900 font-semibold'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {dueStatus.isOverdue ? (
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
              ) : (
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              <span>{formatDateFriendly(task.dueDate)}</span>
              {dueStatus.isOverdue && !task.completed && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold ml-0.5">
                  ({dueStatus.text})
                </span>
              )}
            </span>

            {/* Time badge if specified */}
            {task.hasTime && task.dueTime && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                  dueStatus.isDueSoon
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 font-bold animate-pulse'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatTime12h(task.dueTime)}</span>
                {dueStatus.isDueSoon && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-300 font-sans ml-0.5">
                    ({dueStatus.text})
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className={`text-sm font-semibold text-slate-900 dark:text-white leading-snug break-words ${
              task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
            }`}
          >
            {task.title}
          </h4>

          {/* Collapsible preview / notes */}
          {task.description && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {expanded ? (
                <p className="whitespace-pre-wrap mt-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 font-sans">
                  {task.description}
                </p>
              ) : (
                <p className="line-clamp-1 opacity-80">{task.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {task.description && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={expanded ? 'Collapse' : 'Expand notes'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
