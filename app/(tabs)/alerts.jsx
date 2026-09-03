import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../theme/ThemeContext';
import NotificationCard from '../../components/NotificationCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

export default function AlertsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleOpenNotification = async (item) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }

    const reportId = item.reportId?._id || item.reportId;
    if (reportId) {
      router.push(`/report/${reportId}`);
    }
  };

  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Alerts Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            Civic Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgePillText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllBtn}
            accessibilityLabel="Mark all alerts as read"
          >
            <MaterialCommunityIcons name="check-all" size={16} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary, fontSize: fontSizes.xs }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications Feed */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleOpenNotification(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={() => {
          if (isLoading) {
            return <LoadingState message="Loading your civic notifications..." />;
          }
          return (
            <EmptyState
              icon="bell-check-outline"
              title="No Alerts Yet"
              subtitle="Updates about your reported issues, reviews, approvals, and resolution proofs will appear here."
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  markAllText: {
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
