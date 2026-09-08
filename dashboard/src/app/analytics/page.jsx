'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderClock,
  Layers,
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';

export default function AnalyticsPage() {
  const { reports, stats, isLoaded } = useReports();

  // 1. Issue volume by Category
  const categoryData = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    const categoryColors = {
      Pothole: '#EF4444',
      Garbage: '#F59E0B',
      'Broken Streetlight': '#8B5CF6',
      'Damaged Road': '#EC4899',
      'Water Leakage': '#0EA5E9',
      'Drainage Problem': '#06B6D4',
      'Public Property Damage': '#6366F1',
      Other: '#64748B',
    };

    return Object.keys(counts).map((cat) => ({
      category: cat,
      count: counts[cat],
      color: categoryColors[cat] || '#3B82F6',
    }));
  }, [reports]);

  // 2. Status distribution for Pie chart
  const statusData = useMemo(() => {
    return [
      { name: 'Pending Review', value: stats.pending, color: '#F59E0B' },
      { name: 'Under Review', value: stats.under_review, color: '#0284C7' },
      { name: 'Approved', value: stats.approved, color: '#6366F1' },
      { name: 'Resolved', value: stats.resolved, color: '#10B981' },
      { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // 3. Priority distribution for Donut / Bar
  const priorityData = useMemo(() => {
    const high = reports.filter((r) => r.priority === 'high').length;
    const medium = reports.filter((r) => r.priority === 'medium').length;
    const low = reports.filter((r) => r.priority === 'low').length;

    return [
      { name: 'High Priority', count: high, color: '#EF4444' },
      { name: 'Medium Priority', count: medium, color: '#F59E0B' },
      { name: 'Low Priority', count: low, color: '#64748B' },
    ];
  }, [reports]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Calculating analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Municipal Operations Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Performance metrics, issue volume distribution, and SLA resolution velocity across Ward 7.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Issues */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14% vs last mo
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Logged through mobile civic reporting app
          </p>
        </div>

        {/* Resolution Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.resolutionRate}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({stats.resolved}/{stats.total})
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.resolutionRate}%` }}
            />
          </div>
        </div>

        {/* Avg Turnaround Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Turnaround</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.avgTurnaroundTime}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              42.5 hrs SLA avg
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            From citizen report to repair sign-off
          </p>
        </div>

        {/* Active Backlog */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Backlog</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <FolderClock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.activeBacklog}
            </span>
            <span className="text-xs font-bold text-red-500">
              {stats.highPriority} High Urgency
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Requires field triage or crew completion
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Issue Volume by Category (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Issue Volume by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of incident categories across current queue
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {categoryData.length} Categories
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="category"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution (Pie / Donut Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Status Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational states of all registered municipal tickets
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              100% Accounted
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Priority Matrix breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Priority & Urgency Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Work triage distribution across High, Medium, and Low severity tiers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {priorityData.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.name}
                </span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {item.count} <span className="text-xs font-normal text-slate-400">tickets</span>
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: item.color }}
              >
                {Math.round((item.count / stats.total) * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
