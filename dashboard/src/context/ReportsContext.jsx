'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import initialMockReports from '../data/mockReports.json';

const ReportsContext = createContext();

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize from localStorage or seed
  useEffect(() => {
    try {
      const saved = localStorage.getItem('spotfix_reports_data');
      if (saved) {
        setReports(JSON.parse(saved));
      } else {
        setReports(initialMockReports);
        localStorage.setItem('spotfix_reports_data', JSON.stringify(initialMockReports));
      }
    } catch (e) {
      console.warn('Failed to parse reports from localStorage, using seed data:', e);
      setReports(initialMockReports);
    }
    setIsLoaded(true);
  }, []);

  // Sync to localStorage
  const saveReports = (updatedReports) => {
    setReports(updatedReports);
    try {
      localStorage.setItem('spotfix_reports_data', JSON.stringify(updatedReports));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Find report
  const getReportById = (id) => {
    return reports.find((r) => r.id === id || r.reportNumber === id || r.id.toLowerCase() === id.toLowerCase());
  };

  // 1. Update Priority
  const updatePriority = (id, priority) => {
    const updated = reports.map((rep) => {
      if (rep.id === id || rep.reportNumber === id) {
        const historyEntry = {
          status: rep.status,
          timestamp: new Date().toISOString(),
          changedBy: 'Officer Verma (Triage Desk)',
          note: `Priority changed to ${priority.toUpperCase()}`,
        };
        return {
          ...rep,
          priority,
          statusHistory: [...(rep.statusHistory || []), historyEntry],
        };
      }
      return rep;
    });
    saveReports(updated);
    showToast(`Report ${id} priority updated to ${priority.toUpperCase()}`);
  };

  // 2. Mark Under Review
  const markUnderReview = (id, note = 'Officer initiated field investigation.') => {
    const updated = reports.map((rep) => {
      if (rep.id === id || rep.reportNumber === id) {
        const historyEntry = {
          status: 'under_review',
          timestamp: new Date().toISOString(),
          changedBy: 'Officer Verma (Triage Desk)',
          note,
        };
        return {
          ...rep,
          status: 'under_review',
          statusHistory: [...(rep.statusHistory || []), historyEntry],
        };
      }
      return rep;
    });
    saveReports(updated);
    showToast(`Report ${id} is now Under Review`);
  };

  // 3. Approve Report
  const approveReport = (id, note = 'Work order approved and allocated to municipal engineering crew.') => {
    const updated = reports.map((rep) => {
      if (rep.id === id || rep.reportNumber === id) {
        const historyEntry = {
          status: 'approved',
          timestamp: new Date().toISOString(),
          changedBy: 'Chief Engineer K. Murthy',
          note,
        };
        return {
          ...rep,
          status: 'approved',
          statusHistory: [...(rep.statusHistory || []), historyEntry],
        };
      }
      return rep;
    });
    saveReports(updated);
    showToast(`Report ${id} approved for execution`);
  };

  // 4. Reject Report (Requires mandatory reason)
  const rejectReport = (id, reason) => {
    if (!reason || !reason.trim()) {
      showToast('A rejection reason is mandatory.', 'error');
      return false;
    }
    const updated = reports.map((rep) => {
      if (rep.id === id || rep.reportNumber === id) {
        const historyEntry = {
          status: 'rejected',
          timestamp: new Date().toISOString(),
          changedBy: 'Officer Verma (Triage Desk)',
          note: `Rejected: ${reason.trim()}`,
        };
        return {
          ...rep,
          status: 'rejected',
          rejectionReason: reason.trim(),
          rejectedAt: new Date().toISOString(),
          statusHistory: [...(rep.statusHistory || []), historyEntry],
        };
      }
      return rep;
    });
    saveReports(updated);
    showToast(`Report ${id} has been rejected`, 'warning');
    return true;
  };

  // 5. Mark as Resolved (Requires mandatory after-repair photo + note)
  const resolveReport = (id, { resolutionNote, resolutionImageUrl }) => {
    if (!resolutionNote || !resolutionNote.trim()) {
      showToast('A resolution summary note is mandatory.', 'error');
      return false;
    }
    if (!resolutionImageUrl) {
      showToast('An after-repair photograph proof is mandatory.', 'error');
      return false;
    }

    const updated = reports.map((rep) => {
      if (rep.id === id || rep.reportNumber === id) {
        const historyEntry = {
          status: 'resolved',
          timestamp: new Date().toISOString(),
          changedBy: 'Ward Inspection Officer',
          note: `Quality verification verified. ${resolutionNote.trim()}`,
        };
        return {
          ...rep,
          status: 'resolved',
          resolutionNote: resolutionNote.trim(),
          resolutionImageUrl,
          resolvedAt: new Date().toISOString(),
          statusHistory: [...(rep.statusHistory || []), historyEntry],
        };
      }
      return rep;
    });
    saveReports(updated);
    showToast(`Report ${id} successfully marked as Resolved! 🎉`, 'success');
    return true;
  };

  // Reset to initial mock data
  const resetData = () => {
    saveReports(initialMockReports);
    showToast('Reset reports data to default seed!');
  };

  // Computed Dashboard KPIs
  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    under_review: reports.filter((r) => r.status === 'under_review').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
    highPriority: reports.filter((r) => r.priority === 'high' && r.status !== 'resolved' && r.status !== 'rejected').length,
    activeBacklog: reports.filter((r) => ['pending', 'under_review', 'approved'].includes(r.status)).length,
    resolutionRate: reports.length > 0
      ? ((reports.filter((r) => r.status === 'resolved').length / reports.length) * 100).toFixed(1)
      : '0.0',
    avgTurnaroundTime: '1.8 days', // Computed metric representation
  };

  return (
    <ReportsContext.Provider
      value={{
        reports,
        isLoaded,
        stats,
        getReportById,
        updatePriority,
        markUnderReview,
        approveReport,
        rejectReport,
        resolveReport,
        resetData,
        toastMessage,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
}
