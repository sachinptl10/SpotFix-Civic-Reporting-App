import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import analyticsService from '../../services/analyticsService';
import LoadingState from '../../components/LoadingState';

export default function GovernmentAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await analyticsService.getSummary();
      if (res && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn('[Analytics] Load error:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading && !analytics) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Calculating municipal civic analytics..." />
      </View>
    );
  }

  const byStatus = analytics?.byStatus || {};
  const byCategory = analytics?.byCategory || {};
  const byPriority = analytics?.byPriority || {};
  const total = analytics?.total || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadAnalytics(true)}
          colors={['#0284C7']}
          tintColor="#0284C7"
        />
      }
    >
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xxl }]}>
          Municipal Analytics
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
          Real-time Civic Issue Resolution & Response Metrics
        </Text>
      </View>

      {/* Top Stat Overview Grid */}
      <View style={styles.statGrid}>
        {/* Total Issues */}
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#2563EB" />
          </View>
          <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: fontSizes.xxl }]}>
            {total}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Total Reports
          </Text>
        </View>

        {/* Resolution Rate */}
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="check-decagram" size={22} color="#059669" />
          </View>
          <Text style={[styles.kpiValue, { color: '#059669', fontSize: fontSizes.xxl }]}>
            {analytics?.resolutionRate ?? 0}%
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Resolution Rate
          </Text>
        </View>

        {/* Pending / Active */}
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.kpiIconBox, { backgroundColor: '#FFFBEB' }]}>
            <MaterialCommunityIcons name="clock-alert-outline" size={22} color="#D97706" />
          </View>
          <Text style={[styles.kpiValue, { color: '#D97706', fontSize: fontSizes.xxl }]}>
            {analytics?.activeReviewCount ?? 0}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Active in Review
          </Text>
        </View>
      </View>

      {/* Status Breakdown Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
          Status Breakdown
        </Text>

        {[
          { key: 'pending', label: 'Pending Review', count: byStatus.pending || 0, color: '#3B82F6' },
          { key: 'under_review', label: 'Under Review', count: byStatus.under_review || 0, color: '#8B5CF6' },
          { key: 'approved', label: 'Approved for Work', count: byStatus.approved || 0, color: '#0284C7' },
          { key: 'resolved', label: 'Resolved & Verified', count: byStatus.resolved || 0, color: '#10B981' },
          { key: 'rejected', label: 'Rejected', count: byStatus.rejected || 0, color: '#EF4444' },
        ].map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <View key={item.key} style={styles.breakdownRow}>
              <View style={styles.breakdownHeader}>
                <View style={styles.breakdownLabelGroup}>
                  <View style={[styles.bulletDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.breakdownLabel, { color: colors.textPrimary, fontSize: fontSizes.xs + 1 }]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={[styles.breakdownCount, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                  {item.count} ({pct}%)
                </Text>
              </View>

              {/* Progress Track */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(pct, item.count > 0 ? 3 : 0)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Category Breakdown Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
          Reports by Issue Category
        </Text>

        {[
          { key: 'roads', label: 'Roads & Potholes', count: byCategory.roads || 0, icon: 'road-variant', color: '#F59E0B' },
          { key: 'sanitation', label: 'Sanitation & Garbage', count: byCategory.sanitation || 0, icon: 'delete-outline', color: '#10B981' },
          { key: 'electricity', label: 'Streetlights & Electrical', count: byCategory.electricity || 0, icon: 'lightning-bolt', color: '#EAB308' },
          { key: 'water', label: 'Water Leakage & Supply', count: byCategory.water || 0, icon: 'water-outline', color: '#3B82F6' },
          { key: 'drainage', label: 'Drainage & Sewage', count: byCategory.drainage || 0, icon: 'waves', color: '#06B6D4' },
          { key: 'public-property', label: 'Public Property Damage', count: byCategory['public-property'] || 0, icon: 'domain', color: '#6366F1' },
          { key: 'other', label: 'Other Civic Issues', count: byCategory.other || 0, icon: 'help-circle-outline', color: '#64748B' },
        ].map((cat) => {
          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
          return (
            <View key={cat.key} style={styles.breakdownRow}>
              <View style={styles.breakdownHeader}>
                <View style={styles.breakdownLabelGroup}>
                  <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} style={{ marginRight: 6 }} />
                  <Text style={[styles.breakdownLabel, { color: colors.textPrimary, fontSize: fontSizes.xs + 1 }]}>
                    {cat.label}
                  </Text>
                </View>
                <Text style={[styles.breakdownCount, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                  {cat.count}
                </Text>
              </View>

              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(pct, cat.count > 0 ? 3 : 0)}%`,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Priority Distribution Grid */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
          Priority Distribution
        </Text>

        <View style={styles.priorityGrid}>
          <View style={[styles.priorityCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.priorityCount, { color: '#EF4444' }]}>{byPriority.high || 0}</Text>
            <Text style={styles.priorityTag}>High Priority</Text>
          </View>

          <View style={[styles.priorityCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Text style={[styles.priorityCount, { color: '#F59E0B' }]}>{byPriority.medium || 0}</Text>
            <Text style={styles.priorityTag}>Medium Priority</Text>
          </View>

          <View style={[styles.priorityCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Text style={[styles.priorityCount, { color: '#10B981' }]}>{byPriority.low || 0}</Text>
            <Text style={styles.priorityTag}>Low Priority</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiValue: {
    fontWeight: '800',
  },
  kpiLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 14,
  },
  breakdownRow: {
    marginBottom: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownLabel: {
    fontWeight: '600',
  },
  breakdownCount: {
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  priorityCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  priorityTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    color: '#475569',
  },
});
