import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const PRIORITY_CONFIG = {
  high: {
    label: 'High Priority',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'alert-decagram',
  },
  medium: {
    label: 'Medium Priority',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: 'alert-circle-outline',
  },
  low: {
    label: 'Routine Priority',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'calendar-clock-outline',
  },
};

export default function PriorityBadge({ priority = 'medium', size = 'md', style }) {
  const { borderRadius, fontSizes } = useTheme();
  const normalized = (priority || 'medium').toLowerCase();
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.medium;
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
