import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reportService from '../services/reportService';
import { useAuth } from './AuthContext';

const CACHE_REPORTS_KEY = '@spotfix_offline_reports';
const CACHE_STATS_KEY = '@spotfix_offline_stats';

const ReportContext = createContext(null);

export const ReportProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    rejected: 0,
  });

  // Loading and pagination states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Error and offline status
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Keep track of active query parameters
  const currentParamsRef = useRef({});
  const isFetchingRef = useRef(false);

  // Restore cached offline data on launch
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [cachedReports, cachedStats] = await Promise.all([
          AsyncStorage.getItem(CACHE_REPORTS_KEY),
          AsyncStorage.getItem(CACHE_STATS_KEY),
        ]);

        if (cachedReports) {
          const parsed = JSON.parse(cachedReports);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReports(parsed);
          }
        }

        if (cachedStats) {
          const parsedStats = JSON.parse(cachedStats);
          if (parsedStats) {
            setStats(parsedStats);
          }
        }
      } catch (err) {
        console.warn('[ReportContext] Failed to load offline cache:', err);
      }
    };

    loadCachedData();
  }, []);

  /**
   * Fetch reports with query, category, status, and pagination
   */
  const fetchReports = useCallback(
    async (params = {}, isRefresh = false) => {
      if (!isAuthenticated) return;
      if (isFetchingRef.current && !isRefresh) return;

      isFetchingRef.current = true;
      currentParamsRef.current = { ...params };

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const queryParams = {
          page: 1,
          limit: 10,
          ...params,
        };

        const response = await reportService.getReports(queryParams);

        if (response && response.reports) {
          setReports(response.reports);
          setPage(1);
          setHasMore(Boolean(response.hasMore));
          setTotalCount(response.total || response.reports.length);
          setIsOffline(false);

          // Update offline cache for initial/unfiltered queries
          if (!params.q && (!params.category || params.category === 'All')) {
            AsyncStorage.setItem(CACHE_REPORTS_KEY, JSON.stringify(response.reports)).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[ReportContext] Fetch reports error:', err);
        setError(err.message || 'Failed to fetch reports.');

        if (err.isNetworkError) {
          setIsOffline(true);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [isAuthenticated]
  );

  /**
   * Load next page of reports (infinite scroll)
   */
  const loadMoreReports = useCallback(async () => {
    if (!isAuthenticated || isLoadingMore || !hasMore || isFetchingRef.current) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const queryParams = {
        ...currentParamsRef.current,
        page: nextPage,
        limit: 10,
      };

      const response = await reportService.getReports(queryParams);

      if (response && response.reports && response.reports.length > 0) {
        setReports((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((r) => r._id || r.id));
          const newItems = response.reports.filter((r) => !existingIds.has(r._id || r.id));
          return [...prev, ...newItems];
        });

        setPage(nextPage);
        setHasMore(Boolean(response.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[ReportContext] Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, isLoadingMore, hasMore, page]);

  /**
   * Fetch statistical counts for profile screen
   */
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await reportService.getReportStats();
      if (response && response.stats) {
        setStats(response.stats);
        AsyncStorage.setItem(CACHE_STATS_KEY, JSON.stringify(response.stats)).catch(() => {});
      }
    } catch (err) {
      console.warn('[ReportContext] Fetch stats error:', err);
      if (err.isNetworkError) setIsOffline(true);
    }
  }, [isAuthenticated]);

  /**
   * Add a newly submitted report to local state
   */
  const addReport = useCallback((newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1,
    }));
  }, []);

  /**
   * Update report in local state after an edit
   */
  const updateReportInState = useCallback((updatedReport) => {
    setReports((prev) =>
      prev.map((item) => ((item._id || item.id) === (updatedReport._id || updatedReport.id) ? updatedReport : item))
    );
  }, []);

  /**
   * Remove deleted report from local state
   */
  const deleteReportFromState = useCallback((deletedId) => {
    setReports((prev) => {
      const target = prev.find((r) => (r._id || r.id) === deletedId);
      if (target) {
        setStats((s) => ({
          ...s,
          total: Math.max(0, s.total - 1),
          resolved: target.status === 'Resolved' ? Math.max(0, s.resolved - 1) : s.resolved,
          pending: (target.status === 'Pending' || target.status === 'Submitted' || target.status === 'In Progress' || target.status === 'Under Review')
            ? Math.max(0, s.pending - 1)
            : s.pending,
        }));
      }
      return prev.filter((r) => (r._id || r.id) !== deletedId);
    });
  }, []);

  return (
    <ReportContext.Provider
      value={{
        reports,
        stats,
        totalCount,
        isLoading,
        isRefreshing,
        isLoadingMore,
        hasMore,
        error,
        isOffline,
        fetchReports,
        loadMoreReports,
        fetchStats,
        addReport,
        updateReportInState,
        deleteReportFromState,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export default ReportContext;
