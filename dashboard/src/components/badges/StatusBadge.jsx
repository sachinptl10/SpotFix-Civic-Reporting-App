import React from 'react';
import { Clock, Eye, CheckCircle2, XCircle, CheckCheck } from 'lucide-react';

export default function StatusBadge({ status, size = 'sm' }) {
  const s = (status || 'pending').toLowerCase();

  const configs = {
    pending: {
      label: 'Pending Review',
      icon: Clock,
      classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    },
    under_review: {
      label: 'Under Review',
      icon: Eye,
      classes: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle2,
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCheck,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
    },
  };

  const config = configs[s] || configs.pending;
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${config.classes}`}
    >
      <Icon className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
