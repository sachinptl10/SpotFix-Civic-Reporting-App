import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { formatDate } from '../utils/helpers';
import StatusBadge from './StatusBadge';

const NOTIF_ICONS = {
  report_submitted: { icon: 'send-check', color: '#3B82F6' },
  under_review: { icon: 'progress-clock', color: '#8B5CF6' },
  approved: { icon: 'check-decagram', color: '#0284C7' },
  rejected: { icon: 'close-circle', color: '#EF4444' },
  resolved: { icon: 'check-circle', color: '#10B981' },
};

export default function NotificationCard({ notification, onPress }) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  if (!notification) return null;

  const isUnread = !notification.isRead;
  const config = NOTIF_ICONS[notification.type] || { icon: 'bell-outline', color: colors.primary };
  const reportRef = notification.reportId?.reportNumber
    ? `#${notification.reportId.reportNumber}`
    : '';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isUnread ? colors.surfaceSubtle : colors.surface,
          borderColor: isUnread ? colors.primary : colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Type Icon */}
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <MaterialCommunityIcons name={config.icon} size={18} color="#FFFFFF" />
        </View>

        {/* Message and Metadata */}
        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            {reportRef ? (
              <Text style={[styles.reportRef, { color: colors.primary, fontSize: fontSizes.xs }]}>
                {reportRef}
              </Text>
            ) : null}
            <Text style={[styles.dateText, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>

          <Text
            style={[
              styles.messageText,
              {
                color: colors.textPrimary,
                fontSize: fontSizes.sm,
                fontWeight: isUnread ? '700' : '400',
              },
            ]}
            numberOfLines={3}
          >
            {notification.message}
          </Text>
        </View>

        {/* Unread indicator dot */}
        {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportRef: {
    fontWeight: '800',
  },
  dateText: {
    fontWeight: '500',
  },
  messageText: {
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
