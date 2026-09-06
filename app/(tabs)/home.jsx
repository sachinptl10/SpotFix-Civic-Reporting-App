import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import ReportCard from '../../components/ReportCard';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import useDebounce from '../../hooks/useDebounce';
import { CATEGORIES } from '../../utils/constants';

const FILTER_CATEGORIES = [{ id: 'All', label: 'All Issues', icon: 'view-grid-outline' }, ...CATEGORIES];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const {
    reports,
    totalCount,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    isOffline,
    fetchReports,
    loadMoreReports,
  } = useReports();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Trigger search / filter on changes
  useEffect(() => {
    fetchReports({
      q: debouncedSearch,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
    });
  }, [debouncedSearch, selectedCategory, fetchReports]);

  const onRefresh = useCallback(() => {
    fetchReports(
      {
        q: debouncedSearch,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
      },
      true
    );
  }, [debouncedSearch, selectedCategory, fetchReports]);

  const handleCreateReport = () => {
    router.push('/report/camera');
  };

  const handleOpenReport = (reportId) => {
    router.push(`/report/${reportId}`);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  // Header component for FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Offline Alert Banner */}
      {isOffline && (
        <View style={[styles.offlineBanner, { borderRadius: borderRadius.sm }]}>
          <MaterialCommunityIcons name="wifi-off" size={16} color="#92400E" style={{ marginRight: 8 }} />
          <Text style={styles.offlineText}>Offline Storage Active — Displaying cached local reports</Text>
        </View>
      )}

      {/* Primary Civic Dispatch Hero */}
      <View
        style={[
          styles.greetingCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTextContainer}>
            <View style={[styles.badgeOrg, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="city" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeOrgText, { color: colors.primary, fontSize: fontSizes.tiny }]}>
                Municipal Works Portal
              </Text>
            </View>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
              Civic Issue Dispatch
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
              Report potholes, streetlight hazards, or sanitation problems directly for municipal triage.
            </Text>
          </View>
        </View>

        <CustomButton
          title="Photograph & Report Issue"
          icon="camera-plus-outline"
          onPress={handleCreateReport}
          size="lg"
          variant="signal"
          style={styles.ctaButton}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <CustomInput
          placeholder="Filter by title, category, or street address"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="magnify"
          rightIcon={searchQuery ? 'close-circle' : null}
          onRightIconPress={() => setSearchQuery('')}
          style={{ marginBottom: spacing.sm }}
        />

        {/* Horizontal Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon || 'tag-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: fontSizes.xs,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed Title and Stats */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
          My Civic Reports
        </Text>
        <View style={[styles.countBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text style={[styles.countBadgeText, { color: colors.textSecondary, fontSize: fontSizes.tiny }]}>
            {totalCount} Active
          </Text>
        </View>
      </View>
    </View>
  );

  // Footer for pagination spinner
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Loading more reports...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => handleOpenReport(item._id || item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => {
          if (isLoading) {
            return <LoadingState message="Loading civic reports..." />;
          }
          if (error && reports.length === 0) {
            return (
              <ErrorState
                title="Could Not Load Reports"
                message={error}
                onRetry={() => fetchReports()}
              />
            );
          }
          if (searchQuery.trim() || selectedCategory !== 'All') {
            return (
              <EmptyState
                icon="file-search-outline"
                title="No Matching Reports"
                subtitle={`No issues found matching "${searchQuery || selectedCategory}". Try clearing your filters.`}
                buttonTitle="Reset Search"
                onButtonPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              />
            );
          }
          return (
            <EmptyState
              icon="clipboard-alert-outline"
              title="No reports yet"
              subtitle="Spotted a local problem?&#10;Create your first report and help improve your community."
              buttonTitle="+ Report an Issue"
              onButtonPress={handleCreateReport}
            />
          );
        }}
        onEndReached={loadMoreReports}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button: Instant Photo Capture & Report */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCreateReport}
        style={[
          styles.floatingActionButton,
          {
            backgroundColor: colors.primary,
            bottom: 24,
          },
        ]}
        accessibilityLabel="Photograph and report civic issue"
      >
        <MaterialCommunityIcons name="camera-plus" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Snap Photo</Text>
      </TouchableOpacity>
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  offlineText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  greetingCard: {
    borderWidth: 1,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  greetingTextContainer: {
    flex: 1,
  },
  badgeOrg: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeOrgText: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  greetingTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  ctaButton: {
    width: '100%',
  },
  searchSection: {
    marginTop: 4,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  filterChipText: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderRadius: 4,
  },
  countBadgeText: {
    fontWeight: '600',
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
  floatingActionButton: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9999,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
