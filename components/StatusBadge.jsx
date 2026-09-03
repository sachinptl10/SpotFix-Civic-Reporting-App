import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const STATUS_MAP = {
  pending: {
    label: 'Pending Review',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'clock-outline',
  },
  under_review: {
    label: 'Under Review',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    icon: 'progress-clock',
  },
  approved: {
    label: 'Approved',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    icon: 'check-decagram-outline',
  },
  resolved: {
    label: 'Resolved',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: 'check-circle-outline',
  },
  rejected: {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
  // Backward compatibility mappings
  Submitted: {
    label: 'Pending Review',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'clock-outline',
  },
  'Under Review': {
    label: 'Under Review',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    icon: 'progress-clock',
  },
  Resolved: {
    label: 'Resolved',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: 'check-circle-outline',
  },
  Rejected: {
    label: 'Rejected',
    color: '#EF4444',
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
          borderRadius: borderRadius.full,
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
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
  },
});
