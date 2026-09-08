import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function SLABadge({ slaDeadline, status }) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/40">
        <CheckCircle className="w-3 h-3" />
        SLA Met
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
        Closed
      </span>
    );
  }

  if (!slaDeadline) return null;

  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diffMs = deadline - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 0) {
    const overdueHours = Math.abs(diffHours);
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-300 dark:border-red-800 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        OVERDUE {overdueHours > 0 ? `(${overdueHours}h)` : ''}
      </span>
    );
  }

  if (diffHours <= 12) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
        <Clock className="w-3 h-3" />
        Urgent: {diffHours}h left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
      <Clock className="w-3 h-3" />
      {diffHours}h remaining
    </span>
  );
}
