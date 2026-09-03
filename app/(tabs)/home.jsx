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
        <View style={[styles.offlineBanner, { borderRadius: borderRadius.md }]}>
          <MaterialCommunityIcons name="wifi-off" size={18} color="#92400E" style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>Offline Mode • Showing cached reports</Text>
        </View>
      )}

      {/* Greeting Card */}
      <View
        style={[
          styles.greetingCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTextContainer}>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary, fontSize: fontSizes.xxl }]}>
              Hello, {firstName}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
              Report local problems and help improve your community.
            </Text>
          </View>
          <View style={[styles.badgeIconCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <MaterialCommunityIcons name="city-variant" size={28} color={colors.primary} />
          </View>
        </View>

        <CustomButton
          title="+ Report an Issue"
          onPress={handleCreateReport}
          size="lg"
          variant="primary"
          style={styles.ctaButton}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <CustomInput
          placeholder="Search by title, category, or street address..."
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
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon || 'tag-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: fontSizes.xs,
                      fontWeight: isSelected ? '700' : '500',
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
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
          My Reports
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          {totalCount} {totalCount === 1 ? 'report' : 'reports'}
        </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  greetingTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    marginTop: 4,
    lineHeight: 20,
  },
  badgeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
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
  },
  sectionCount: {
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
});
