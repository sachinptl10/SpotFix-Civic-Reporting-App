import React from 'react';

export default function PriorityBadge({ priority, size = 'sm' }) {
  const p = (priority || 'low').toLowerCase();

  const configs = {
    high: {
      label: 'High Priority',
      classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60',
      dot: 'bg-red-500 animate-pulse',
    },
    medium: {
      label: 'Medium Priority',
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'Low Priority',
      classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };

  const config = configs[p] || configs.low;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
