import React from 'react';
import { X, Info, Tag, CheckCircle2 } from 'lucide-react';
import { CATEGORY_DEFINITIONS, TaskCategory } from '../types/task';
import { CategoryBadge } from './CategoryBadge';

interface CategoryLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryLegendModal: React.FC<CategoryLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories: TaskCategory[] = ['NC', 'EX', 'ME'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Info className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Task Categories (NC • EX • ME)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorization framework for maximum clarity
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

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Every task in SyncTasks is tagged with one of three primary categories designed to balance execution focus, coordination, and routine upkeep across all your devices:
          </p>

          <div className="space-y-3">
            {categories.map((cat) => {
              const meta = CATEGORY_DEFINITIONS[cat];
              return (
                <div
                  key={cat}
                  className={`p-4 rounded-xl border ${meta.borderClass} border-l-4 bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <CategoryBadge category={cat} size="md" />
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Code: {meta.code}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {meta.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {meta.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
            <span className="font-semibold block mb-0.5">Multi-Device Synchronization:</span>
            Filter, sort, and change categories on any phone or computer. The changes propagate to your other connected screens instantly!
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
