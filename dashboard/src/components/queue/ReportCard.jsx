'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight, User, ExternalLink } from 'lucide-react';
import StatusBadge from '../badges/StatusBadge';
import PriorityBadge from '../badges/PriorityBadge';
import SLABadge from '../badges/SLABadge';

export default function ReportCard({ report, onOpenMedia }) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(report.createdAt));

  const categoryColors = {
    Pothole: 'bg-red-500 text-white',
    Garbage: 'bg-amber-500 text-white',
    'Broken Streetlight': 'bg-purple-600 text-white',
    'Damaged Road': 'bg-pink-600 text-white',
    'Water Leakage': 'bg-sky-500 text-white',
    'Drainage Problem': 'bg-cyan-600 text-white',
    'Public Property Damage': 'bg-indigo-600 text-white',
    Other: 'bg-slate-600 text-white',
  };

  const catColor = categoryColors[report.category] || 'bg-slate-700 text-white';

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-brand-primary/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col md:flex-row">
      {/* Media Thumbnail Section */}
      <div className="relative md:w-56 h-48 md:h-auto shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={report.imageUrl}
          alt={report.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Floating Category Pill */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm ${catColor}`}
          >
            {report.category}
          </span>
        </div>

        {/* Click to Zoom Overlay Button */}
        {onOpenMedia && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onOpenMedia(report.imageUrl, `${report.reportNumber}: ${report.title}`);
            }}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Inspect Full Image"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header Row: ID, Badges, SLA */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {report.reportNumber}
              </span>
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>

            <div className="flex items-center gap-2">
              <SLABadge slaDeadline={report.slaDeadline} status={report.status} />
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-brand-primary dark:group-hover:text-blue-400 transition-colors">
            {report.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {report.description}
          </p>

          {/* Location & Citizen details */}
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate max-w-xs">{report.address}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{report.citizen?.name}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {report.statusHistory?.length || 1} audit log events
          </span>

          <Link
            href={`/report/${report.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-brand-primary hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-200"
          >
            <span>Review Issue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
