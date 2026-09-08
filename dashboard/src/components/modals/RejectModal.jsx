'use client';

import React, { useState } from 'react';
import { X, AlertOctagon } from 'lucide-react';

export default function RejectModal({ isOpen, onClose, onConfirm, reportNumber }) {
  const [selectedPreset, setSelectedPreset] = useState('Duplicate report');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen) return null;

  const presets = [
    'Duplicate report',
    'Private property issue',
    'Insufficient evidence / unclear photograph',
    'Outside municipal jurisdiction',
    'False report or already resolved prior to inspection',
    'Other (enter custom justification below)',
  ];

  const handleConfirm = () => {
    let finalReason = selectedPreset;
    if (selectedPreset.startsWith('Other') || customNote.trim().length > 0) {
      finalReason = customNote.trim() || selectedPreset;
    }
    if (!finalReason) return;
    onConfirm(finalReason);
  };

  const isOther = selectedPreset.startsWith('Other');
  const isValid = isOther ? customNote.trim().length >= 5 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reject Report {reportNumber}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A formal rejection justification is mandatory and recorded in the audit trail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Primary Rejection Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400"
            >
              {presets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {isOther ? 'Detailed Justification (Required)' : 'Officer Notes / Additional Context'}
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={
                isOther
                  ? 'Please specify exact reason (min 5 characters)...'
                  : 'Add optional internal context or reference work order ID...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
