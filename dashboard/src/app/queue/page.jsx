'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import KPIBar from '../../components/queue/KPIBar';
import ReportCard from '../../components/queue/ReportCard';
import MediaViewerModal from '../../components/modals/MediaViewerModal';

export default function QueuePage() {
  const { reports, isLoaded, stats } = useReports();

  // Filter States
  const [statusTab, setStatusTab] = useState('all'); // all | pending | under_review | approved | resolved | rejected
  const [priorityFilter, setPriorityFilter] = useState('all'); // all | high | medium | low
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Media Inspection Modal State
  const [mediaModal, setMediaModal] = useState({ isOpen: false, imageUrl: '', title: '' });

  // Status Tab options with counts
  const statusTabs = [
    { id: 'all', label: 'All Issues', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending, color: 'text-amber-600' },
    { id: 'under_review', label: 'Under Review', count: stats.under_review, color: 'text-sky-600' },
    { id: 'approved', label: 'Approved', count: stats.approved, color: 'text-indigo-600' },
    { id: 'resolved', label: 'Resolved', count: stats.resolved, color: 'text-emerald-600' },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, color: 'text-rose-600' },
  ];

  const categories = [
    'All Categories',
    'Pothole',
    'Garbage',
    'Broken Streetlight',
    'Damaged Road',
    'Water Leakage',
    'Drainage Problem',
    'Public Property Damage',
    'Other',
  ];

  // Filtered reports logic
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // 1. Status Tab filter
      if (statusTab !== 'all' && rep.status !== statusTab) {
        return false;
      }

      // 2. Priority filter
      if (priorityFilter !== 'all' && rep.priority !== priorityFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'All Categories' && rep.category !== categoryFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = rep.reportNumber?.toLowerCase().includes(q) || rep.id?.toLowerCase().includes(q);
        const matchesTitle = rep.title?.toLowerCase().includes(q);
        const matchesAddress = rep.address?.toLowerCase().includes(q);
        const matchesCitizen = rep.citizen?.name?.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesAddress && !matchesCitizen) {
          return false;
        }
      }

      return true;
    });
  }, [reports, statusTab, priorityFilter, categoryFilter, searchQuery]);

  const handleOpenMedia = (imageUrl, title) => {
    setMediaModal({ isOpen: true, imageUrl, title });
  };

  const handleCloseMedia = () => {
    setMediaModal({ isOpen: false, imageUrl: '', title: '' });
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading municipal triage queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Municipal Triage Queue
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredReports.length} issues
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review, prioritize, and dispatch civic issue reports logged by residents across Ward 7.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Counters Bar */}
      <KPIBar activeStatusTab={statusTab} onSelectTab={setStatusTab} />

      {/* Filter Toolbar Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Horizontal Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
          {statusTabs.map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Second Row: Search, Priority Pills, Category Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, address, or citizen..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2">Priority:</span>
              {['all', 'high', 'medium', 'low'].map((p) => {
                const isActive = priorityFilter === p;
                const labels = { all: 'All', high: 'High', medium: 'Med', low: 'Low' };
                const colors = {
                  all: '',
                  high: 'text-red-600 dark:text-red-400',
                  medium: 'text-amber-600 dark:text-amber-400',
                  low: 'text-slate-600 dark:text-slate-400',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : `text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ${colors[p]}`
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onOpenMedia={handleOpenMedia}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No matching issues in this queue view
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Try adjusting your status tab, clearing your search query, or switching priority filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusTab('all');
              setPriorityFilter('all');
              setCategoryFilter('All Categories');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Media Inspector Modal */}
      <MediaViewerModal
        isOpen={mediaModal.isOpen}
        onClose={handleCloseMedia}
        imageUrl={mediaModal.imageUrl}
        title={mediaModal.title}
      />
    </div>
  );
}
