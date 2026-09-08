'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Filter, MapPin, RefreshCw } from 'lucide-react';
import { useReports } from '../../context/ReportsContext';

// Dynamically import Leaflet map with SSR disabled
const HeatmapView = dynamic(() => import('../../components/map/HeatmapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
      <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />
      <span className="text-xs font-semibold text-slate-500">Initializing GIS Map Canvas...</span>
    </div>
  ),
});

export default function MapPage() {
  const { reports, isLoaded, stats } = useReports();

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (statusFilter !== 'all' && rep.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && rep.priority !== priorityFilter) return false;
      return true;
    });
  }, [reports, statusFilter, priorityFilter]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading map data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Operations Heatmap
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredReports.length} pins active
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time geospatial clustering of municipal civic incidents across Ward 7 and surrounding sectors.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 px-2">Status:</span>
            {['all', 'pending', 'under_review', 'approved', 'resolved'].map((st) => {
              const isActive = statusFilter === st;
              const labels = {
                all: 'All',
                pending: 'Pending',
                under_review: 'Review',
                approved: 'Approved',
                resolved: 'Resolved',
              };
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 px-2">Priority:</span>
            {['all', 'high', 'medium', 'low'].map((pr) => {
              const isActive = priorityFilter === pr;
              const labels = { all: 'All', high: 'High', medium: 'Med', low: 'Low' };
              return (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setPriorityFilter(pr)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {labels[pr]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Component */}
      <HeatmapView
        reports={filteredReports}
        selectedPriority={priorityFilter}
        selectedStatus={statusFilter}
      />
    </div>
  );
}
