'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  History,
  FileCheck,
} from 'lucide-react';
import { useReports } from '../../../context/ReportsContext';
import StatusBadge from '../../../components/badges/StatusBadge';
import PriorityBadge from '../../../components/badges/PriorityBadge';
import SLABadge from '../../../components/badges/SLABadge';
import RejectModal from '../../../components/modals/RejectModal';
import ResolveModal from '../../../components/modals/ResolveModal';
import MediaViewerModal from '../../../components/modals/MediaViewerModal';

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    getReportById,
    updatePriority,
    markUnderReview,
    approveReport,
    rejectReport,
    resolveReport,
    isLoaded,
  } = useReports();

  const report = getReportById(id);

  // Modals
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [mediaViewer, setMediaViewer] = useState({ isOpen: false, url: '', title: '' });

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading issue dossier...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Report Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Could not find report with ID: <span className="font-mono font-bold">{id}</span>
        </p>
        <Link
          href="/queue"
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-blue-700 transition-colors"
        >
          ← Return to Triage Queue
        </Link>
      </div>
    );
  }

  const formattedCreatedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(report.createdAt));

  const handlePriorityChange = (p) => {
    updatePriority(report.id, p);
  };

  const handleUnderReview = () => {
    markUnderReview(report.id);
  };

  const handleApprove = () => {
    approveReport(report.id);
  };

  const handleRejectConfirm = (reason) => {
    const success = rejectReport(report.id, reason);
    if (success) {
      setIsRejectOpen(false);
    }
  };

  const handleResolveConfirm = (data) => {
    const success = resolveReport(report.id, data);
    if (success) {
      setIsResolveOpen(false);
    }
  };

  const isResolved = report.status === 'resolved';
  const isRejected = report.status === 'rejected';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/queue"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Triage Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {report.reportNumber}
          </span>
          <StatusBadge status={report.status} size="md" />
          <SLABadge slaDeadline={report.slaDeadline} status={report.status} />
        </div>
      </div>

      {/* Main 2-Column Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dossier & Evidence (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Evidence Photo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 group overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.imageUrl}
                alt={report.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() =>
                  setMediaViewer({
                    isOpen: true,
                    url: report.imageUrl,
                    title: `${report.reportNumber} Evidence`,
                  })
                }
              />
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-black/75 text-white shadow-sm">
                  {report.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setMediaViewer({
                    isOpen: true,
                    url: report.imageUrl,
                    title: `${report.reportNumber} Evidence`,
                  })
                }
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Inspect Full Size</span>
              </button>
            </div>

            <div className="p-6">
              <h1 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                {report.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.description}
              </p>
            </div>
          </div>

          {/* If Resolved: Resolution Proof Card */}
          {isResolved && (
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                  <h3 className="text-base font-black">Verified Resolution Proof</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Work Order Completed
                </span>
              </div>

              {/* Side-by-side or stacked Before/After photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Before (Citizen Report)
                  </span>
                  <div className="h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.imageUrl}
                      alt="Before repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                    After (Field Repair Proof)
                  </span>
                  <div
                    className="h-40 rounded-xl overflow-hidden border border-emerald-400 dark:border-emerald-700 bg-emerald-100/40 cursor-pointer group relative"
                    onClick={() =>
                      setMediaViewer({
                        isOpen: true,
                        url: report.resolutionImageUrl,
                        title: 'After-Repair Verified Proof',
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.resolutionImageUrl}
                      alt="After repair"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      Click to Enlarge
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-slate-200">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Official Completion Sign-off:
                </span>{' '}
                {report.resolutionNote}
              </div>
            </div>
          )}

          {/* If Rejected: Rejection Notice Card */}
          {isRejected && (
            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Ticket Closed as Rejected</span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                <span className="font-bold">Formal Justification:</span> {report.rejectionReason}
              </p>
            </div>
          )}

          {/* Location & Coordinates Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Geographic Location & Geocoding</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {report.address}
                </span>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GPS: {report.location?.latitude?.toFixed(4)}, {report.location?.longitude?.toFixed(4)}
                </p>
              </div>

              <Link
                href={`/map?lat=${report.location?.latitude}&lng=${report.location?.longitude}`}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-brand-primary dark:text-blue-400 hover:bg-slate-100 transition-colors shrink-0 text-center"
              >
                Inspect on GIS Map →
              </Link>
            </div>
          </div>

          {/* Status History & Audit Stepper */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-primary" />
              <span>Immutable Status Audit Trail</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {report.statusHistory?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white dark:border-slate-900 shadow-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                      {step.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(step.timestamp))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {step.changedBy}:
                    </span>{' '}
                    {step.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Decision & Dispatch Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          {/* Priority Assignment Segmented Control */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                SLA Priority Tier
              </label>
              <PriorityBadge priority={report.priority} />
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              {[
                { id: 'low', label: 'Low', color: 'hover:text-slate-900' },
                { id: 'medium', label: 'Medium', color: 'hover:text-amber-600' },
                { id: 'high', label: 'High (P1)', color: 'hover:text-red-600' },
              ].map((tier) => {
                const isSelected = report.priority === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handlePriorityChange(tier.id)}
                    className={`py-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : `text-slate-500 ${tier.color}`
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Updating priority resets SLA dispatch clock and re-ranks this issue in the field queue.
            </p>
          </div>

          {/* Official Action Dispatch Console */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Triage & Dispatch Actions</span>
            </h3>

            <div className="space-y-2.5">
              {/* Mark Under Review */}
              {report.status === 'pending' && (
                <button
                  type="button"
                  onClick={handleUnderReview}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-500/20 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Mark Under Review</span>
                </button>
              )}

              {/* Approve Report */}
              {(report.status === 'pending' || report.status === 'under_review') && (
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Dispatch Work Crew</span>
                </button>
              )}

              {/* Mark as Resolved */}
              {report.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Mark as Resolved (Requires Proof)</span>
                </button>
              )}

              {/* Reject Report */}
              {report.status !== 'rejected' && report.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Report...</span>
                </button>
              )}

              {/* Already Resolved Indicator */}
              {isResolved && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This issue has been formally resolved and verified.</span>
                </div>
              )}
            </div>
          </div>

          {/* Citizen Reporter Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>Citizen Reporter Information</span>
            </h3>

            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.citizen?.avatar}
                alt={report.citizen?.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {report.citizen?.name}
                </h4>
                <p className="text-xs text-slate-400">Verified Citizen Account</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`tel:${report.citizen?.phone}`}
                  className="hover:underline font-mono text-slate-800 dark:text-slate-200"
                >
                  {report.citizen?.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`mailto:${report.citizen?.email}`}
                  className="hover:underline font-mono text-slate-800 dark:text-slate-200 truncate"
                >
                  {report.citizen?.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Logged on {formattedCreatedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        reportNumber={report.reportNumber}
      />

      {/* Resolve Modal */}
      <ResolveModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onConfirm={handleResolveConfirm}
        reportNumber={report.reportNumber}
        category={report.category}
      />

      {/* Media Inspection Modal */}
      <MediaViewerModal
        isOpen={mediaViewer.isOpen}
        onClose={() => setMediaViewer({ isOpen: false, url: '', title: '' })}
        imageUrl={mediaViewer.url}
        title={mediaViewer.title}
      />
    </div>
  );
}
