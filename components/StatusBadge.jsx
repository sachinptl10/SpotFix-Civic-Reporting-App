import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const STATUS_MAP = {
  pending: {
    label: 'Pending Review',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'clock-outline',
  },
  under_review: {
    label: 'Under Review',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'progress-clock',
  },
  approved: {
    label: 'Approved for Work',
    color: '#0E7490',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    icon: 'check-decagram-outline',
  },
  resolved: {
    label: 'Work Completed',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: 'check-circle-outline',
  },
  rejected: {
    label: 'Not Actionable',
    color: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
  // Backward compatibility mappings
  Submitted: {
    label: 'Pending Review',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'clock-outline',
  },
  'Under Review': {
    label: 'Under Review',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'progress-clock',
  },
  Resolved: {
    label: 'Work Completed',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: 'check-circle-outline',
  },
  Rejected: {
    label: 'Not Actionable',
    color: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
};

export default function StatusBadge({ status = 'pending', size = 'md', style }) {
  const { borderRadius, fontSizes } = useTheme();
  const normalized = (status || 'pending').toLowerCase();
  const config = STATUS_MAP[status] || STATUS_MAP[normalized] || STATUS_MAP.pending;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          borderRadius: borderRadius.sm,
        },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={isSmall ? 11 : 13}
        color={config.color}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? fontSizes.tiny : fontSizes.xs,
          },
          isSmall && styles.labelSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
});
