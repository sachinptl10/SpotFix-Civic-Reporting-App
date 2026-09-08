'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  MapPin,
  BarChart3,
  Sun,
  Moon,
  RotateCcw,
  ShieldCheck,
  Radio,
  Building2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useReports } from '../context/ReportsContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { stats, resetData } = useReports();

  const navItems = [
    {
      name: 'Triage Queue',
      href: '/queue',
      icon: Inbox,
      badge: stats.pending > 0 ? stats.pending : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      name: 'Operations Heatmap',
      href: '/map',
      icon: MapPin,
      badge: stats.highPriority > 0 ? `${stats.highPriority} High` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      name: 'Analytics Dashboard',
      href: '/analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors z-30">
      {/* Top Section */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                SpotFix
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-brand-primary/10 text-brand-primary dark:text-blue-400 rounded">
                Gov Ops
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Municipal Triage & Resolution
            </p>
          </div>
        </div>

        {/* Dispatch Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Ward 7 Field Ops
            </span>
          </div>
          <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
            ONLINE
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-2">
            Municipal Workspaces
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/queue' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile, Theme, Reset */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Officer Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
            RV
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Officer R. Verma
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Lead Municipal Engineer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all issues to original sample mock data?')) {
                resetData();
              }
            }}
            title="Reset Mock Data"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-slate-500 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          SpotFix Gov Portal v2.4 • Offline/Mock Mode
        </p>
      </div>
    </aside>
  );
}
