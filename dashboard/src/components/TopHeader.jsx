'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useReports } from '../context/ReportsContext';

export default function TopHeader() {
  const { stats, toastMessage } = useReports();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Toast Notification Banner (Floating Center) */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg border ${
              toastMessage.type === 'error'
                ? 'bg-rose-500 text-white border-rose-600'
                : toastMessage.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Left: Territory & Date */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Bengaluru Municipal Corporation (BBMP)
            <span className="text-xs font-normal text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Ward 7 Operations Console
            </span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Right: Quick Telemetry Pills */}
      <div className="flex items-center gap-3">
        {stats.highPriority > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 animate-pulse text-red-500" />
            <span>{stats.highPriority} High Priority Active</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="font-semibold">Resolution Rate:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {stats.resolutionRate}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{stats.resolved} Issues Fixed</span>
        </div>
      </div>
    </header>
  );
}
