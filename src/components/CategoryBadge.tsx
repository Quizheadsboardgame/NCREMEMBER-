import React from 'react';
import { TaskCategory, CATEGORY_DEFINITIONS } from '../types/task';

interface CategoryBadgeProps {
  category: TaskCategory;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showLabel = true,
}) => {
  const meta = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.NC;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-bold tracking-wider',
    md: 'text-xs px-2.5 py-1 font-bold tracking-wider',
    lg: 'text-sm px-3 py-1.5 font-extrabold tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-mono uppercase shadow-xs transition-colors ${meta.badgeBg} ${sizeClasses[size]}`}
      title={`${meta.code}: ${meta.name} - ${meta.subtitle}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} animate-pulse`} />
      <span>{meta.code}</span>
      {showLabel && (
        <span className="font-sans font-medium text-[11px] opacity-80 border-l border-current/20 pl-1.5 ml-0.5 normal-case tracking-normal hidden sm:inline">
          {meta.name}
        </span>
      )}
    </span>
  );
};
