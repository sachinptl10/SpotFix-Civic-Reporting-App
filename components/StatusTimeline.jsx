import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { formatDate } from '../utils/helpers';

const STATUS_ICONS = {
  pending: { icon: 'clock-outline', color: '#334155', label: 'Report Submitted' },
  under_review: { icon: 'progress-clock', color: '#1D4ED8', label: 'Under Review' },
  approved: { icon: 'check-decagram', color: '#0E7490', label: 'Approved for Work' },
  rejected: { icon: 'close-circle', color: '#B91C1C', label: 'Report Rejected' },
  resolved: { icon: 'check-circle', color: '#15803D', label: 'Work Completed & Verified' },
};

export default function StatusTimeline({ statusHistory = [], currentStatus = 'pending' }) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  // If no statusHistory, generate fallback from current status
  const historyItems = statusHistory.length > 0 ? statusHistory : [
    {
      status: currentStatus,
      note: 'Civic issue reported by citizen',
      timestamp: new Date(),
    },
  ];

  return (
    <View style={styles.container}>
      {historyItems.map((item, index) => {
        const isLast = index === historyItems.length - 1;
        const config = STATUS_ICONS[item.status] || STATUS_ICONS.pending;
        const actorName = item.changedBy?.name || (item.status === 'pending' ? 'Citizen' : 'Municipal Official');

        return (
          <View key={index} style={styles.timelineRow}>
            {/* Left Column: Icon Dot and Vertical Line */}
            <View style={styles.nodeColumn}>
              <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
                <MaterialCommunityIcons name={config.icon} size={14} color="#FFFFFF" />
              </View>
              {!isLast && <View style={[styles.connectingLine, { backgroundColor: colors.border }]} />}
            </View>

            {/* Right Column: Event Content Card */}
            <View style={[styles.contentColumn, { paddingBottom: isLast ? 0 : spacing.md }]}>
              <View
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm + 2,
                  },
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={[styles.statusTitle, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                    {config.label}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>

                {item.note ? (
                  <Text style={[styles.noteText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                    {item.note}
                  </Text>
                ) : null}

                <Text style={[styles.actorText, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
                  Recorded by: {actorName}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontWeight: '700',
  },
  timestamp: {
    fontWeight: '500',
  },
  noteText: {
    lineHeight: 18,
    marginBottom: 4,
  },
  actorText: {
    fontStyle: 'italic',
  },
});
