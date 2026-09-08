'use client';

import React from 'react';
import { Clock, Eye, CheckCircle2, CheckCheck } from 'lucide-react';
import { useReports } from '../../context/ReportsContext';

export default function KPIBar({ activeStatusTab, onSelectTab }) {
  const { stats } = useReports();

  const kpis = [
    {
      id: 'pending',
      label: 'Pending Review',
      count: stats.pending,
      icon: Clock,
      color: 'border-amber-400 dark:border-amber-600',
      bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      description: 'Awaiting initial triage',
    },
    {
      id: 'under_review',
      label: 'Under Review',
      count: stats.under_review,
      icon: Eye,
      color: 'border-sky-400 dark:border-sky-600',
      bgLight: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      description: 'Field inspection active',
    },
    {
      id: 'approved',
      label: 'Approved Work',
      count: stats.approved,
      icon: CheckCircle2,
      color: 'border-indigo-400 dark:border-indigo-600',
      bgLight: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      description: 'Work order dispatched',
    },
    {
      id: 'resolved',
      label: 'Resolved Issues',
      count: stats.resolved,
      icon: CheckCheck,
      color: 'border-emerald-400 dark:border-emerald-600',
      bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      description: 'Verified repairs completed',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeStatusTab === kpi.id;

        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => onSelectTab && onSelectTab(kpi.id)}
            className={`text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm hover:shadow-md ${
              isSelected
                ? `ring-2 ring-brand-primary ${kpi.color}`
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {kpi.label}
              </span>
              <div className={`p-2 rounded-xl ${kpi.bgLight}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {kpi.count}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                tickets
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span>•</span> {kpi.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
