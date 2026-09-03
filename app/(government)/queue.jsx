import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import useDebounce from '../../hooks/useDebounce';
import reportService from '../../services/reportService';
import ReportCard from '../../components/ReportCard';
import CustomInput from '../../components/CustomInput';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pending Review', icon: 'clock-outline' },
  { id: 'under_review', label: 'Under Review', icon: 'progress-clock' },
  { id: 'approved', label: 'Approved', icon: 'check-decagram-outline' },
  { id: 'resolved', label: 'Resolved', icon: 'check-circle-outline' },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle-outline' },
  { id: 'All', label: 'All Reports', icon: 'view-grid-outline' },
];

const PRIORITY_FILTERS = [
  { id: 'All', label: 'All Priorities' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'low', label: 'Low', color: '#10B981' },
];

export default function GovernmentQueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchQueue = useCallback(
    async (isRefresh = false) => {
      if (isFetchingRef.current && !isRefresh) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = {
          page: 1,
          limit: 10,
          status: selectedStatus === 'All' ? undefined : selectedStatus,
          priority: selectedPriority === 'All' ? undefined : selectedPriority,
          search: debouncedSearch || undefined,
        };

        const res = await reportService.getReports(params);
        if (res && res.reports) {
          setReports(res.reports);
          setPage(1);
          setHasMore(Boolean(res.pagination?.hasMore ?? res.hasMore));
          setTotalCount(res.pagination?.total ?? res.total ?? res.reports.length);
        }
      } catch (err) {
        console.warn('[Queue] Fetch error:', err.message);
        toast.showError('Failed to load review queue.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [selectedStatus, selectedPriority, debouncedSearch, toast]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isFetchingRef.current) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        page: nextPage,
        limit: 10,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        priority: selectedPriority === 'All' ? undefined : selectedPriority,
        search: debouncedSearch || undefined,
      };

      const res = await reportService.getReports(params);
      if (res && res.reports && res.reports.length > 0) {
        setReports((prev) => {
          const existingIds = new Set(prev.map((r) => r._id || r.id));
          const fresh = res.reports.filter((r) => !existingIds.has(r._id || r.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setHasMore(Boolean(res.pagination?.hasMore ?? res.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('[Queue] Load more error:', err.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, selectedStatus, selectedPriority, debouncedSearch]);

  const handleOpenReport = (id) => {
    router.push(`/government/report/${id}`);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title & Badge */}
      <View style={styles.portalTitleRow}>
        <View>
          <Text style={[styles.portalTitle, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            Government Review Queue
          </Text>
          <Text style={[styles.portalSubtitle, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Municipal Triage & Civic Issue Approval Portal
          </Text>
        </View>

        <View style={styles.officialBadge}>
          <MaterialCommunityIcons name="shield-account" size={16} color="#0284C7" />
          <Text style={styles.officialBadgeText}>Official</Text>
        </View>
      </View>

      {/* Search Input */}
      <CustomInput
        placeholder="Search by report # (SP-...), title, or address..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon="magnify"
        rightIcon={searchQuery ? 'close-circle' : null}
        onRightIconPress={() => setSearchQuery('')}
        style={{ marginBottom: spacing.sm }}
      />

      {/* Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterRow}
      >
        {STATUS_FILTERS.map((tab) => {
          const isSelected = selectedStatus === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setSelectedStatus(tab.id)}
              style={[
                styles.statusTab,
                {
                  backgroundColor: isSelected ? '#0284C7' : colors.surface,
                  borderColor: isSelected ? '#0284C7' : colors.border,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={14}
                color={isSelected ? '#FFFFFF' : colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.statusTabText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontSize: fontSizes.xs,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Priority Filter Bar */}
      <View style={styles.priorityRow}>
        <Text style={[styles.priorityLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Priority:
        </Text>
        {PRIORITY_FILTERS.map((p) => {
          const isSelected = selectedPriority === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.7}
              onPress={() => setSelectedPriority(p.id)}
              style={[
                styles.priorityChip,
                {
                  backgroundColor: isSelected ? (p.color || colors.primary) : colors.surfaceSubtle,
                  borderColor: isSelected ? (p.color || colors.primary) : colors.border,
                  borderRadius: borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityChipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textPrimary,
                    fontSize: fontSizes.tiny,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Queue count banner */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Showing {reports.length} of {totalCount} reports in queue
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0284C7" />
        <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Loading more queue records...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => handleOpenReport(item._id || item.id)}
            showPriority
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => {
          if (isLoading) {
            return <LoadingState message="Loading government review queue..." />;
          }
          return (
            <EmptyState
              icon="clipboard-check-outline"
              title="Queue is Clear"
              subtitle="No reports currently match this status or filter. All citizen reports have been reviewed."
            />
          );
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchQueue(true)}
            colors={['#0284C7']}
            tintColor="#0284C7"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 8,
  },
  portalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  portalTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  portalSubtitle: {
    marginTop: 2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  officialBadgeText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 11,
  },
  statusFilterRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statusTabText: {},
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priorityLabel: {
    fontWeight: '700',
    marginRight: 4,
  },
  priorityChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  priorityChipText: {},
  countRow: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  countText: {
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontWeight: '500',
  },
});
