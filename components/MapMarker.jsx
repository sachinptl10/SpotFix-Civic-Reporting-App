import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES, COLORS } from '../utils/constants';

export default function MapMarker({ category = 'Other', isSelected = false }) {
  const categoryMeta = CATEGORIES.find((c) => c.id === category) || {
    icon: 'map-marker',
    color: COLORS.primary,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.markerBubble,
          { backgroundColor: categoryMeta.color },
          isSelected && styles.markerSelected,
        ]}
      >
        <MaterialCommunityIcons
          name={categoryMeta.icon}
          size={18}
          color={COLORS.textInverse}
        />
      </View>
      <View
        style={[
          styles.markerPointer,
          { borderTopColor: categoryMeta.color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 48,
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
    borderColor: COLORS.textPrimary,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
