import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { STATUS_CONFIG, BORDER_RADIUS, FONT_SIZES, SPACING } from '../utils/constants';

export default function StatusBadge({ status = 'Submitted', size = 'md', style }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Submitted'];

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={config.color}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
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
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
  },
});
