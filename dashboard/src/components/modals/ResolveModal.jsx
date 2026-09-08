'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function ResolveModal({ isOpen, onClose, onConfirm, reportNumber, category }) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  if (!isOpen) return null;

  // Preset verified after-repair photos for quick testing & realistic simulation
  const sampleProofImages = [
    {
      label: 'Fresh Asphalt Paving',
      url: 'https://images.unsplash.com/photo-1584463699039-446dfa6104df?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Sanitized Clean Sidewalk',
      url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'New LED Streetlight Installed',
      url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Public Safety Railing Fixed',
      url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setResolutionImageUrl(dataUrl);
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (url) => {
    setResolutionImageUrl(url);
    setImagePreview(url);
  };

  const handleConfirm = () => {
    if (!resolutionNote.trim() || !resolutionImageUrl) return;
    onConfirm({
      resolutionNote: resolutionNote.trim(),
      resolutionImageUrl,
    });
  };

  const isValid = resolutionNote.trim().length >= 5 && !!resolutionImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mark Report {reportNumber} as Resolved
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official closure requires verification proof and summary of repairs executed.
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
        <div className="p-6 space-y-5">
          {/* After Repair Photo Proof Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              After-Repair Photo Proof <span className="text-emerald-500">*</span>
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800 group h-48 bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Resolution proof"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setResolutionImageUrl('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md hover:bg-rose-700 transition-colors"
                  >
                    Remove & Replace Photo
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-emerald-600/90 text-white text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Evidence Attached
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File input drag drop box */}
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40 cursor-pointer transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to upload after-repair photograph
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    PNG, JPG, or WEBP from field mobile unit
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Quick select presets */}
                <div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Or select verified field sample photo:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {sampleProofImages.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSample(s.url)}
                        className="text-left px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all text-slate-700 dark:text-slate-300 truncate"
                      >
                        📷 {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Summary Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Resolution Summary & Quality Sign-Off <span className="text-emerald-500">*</span>
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Hot-mix asphalt laid and roller compacted. Area inspected and reopened for normal traffic."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Minimum 5 characters. This summary will be permanently visible to the citizen and municipal auditors.
            </p>
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
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete & Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
