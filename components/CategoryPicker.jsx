import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES } from '../utils/constants';
import { useTheme } from '../theme/ThemeContext';

export default function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  error,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.md }]}>
      <Text style={[styles.label, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
        Issue Category *
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                  borderColor: isSelected ? cat.color : colors.border,
                  borderRadius: borderRadius.full,
                },
                isSelected && styles.chipSelected,
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isSelected ? cat.color : colors.surfaceSubtle },
                ]}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={18}
                  color={isSelected ? '#FFFFFF' : cat.color}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? cat.color : colors.textSecondary,
                    fontSize: fontSizes.xs,
                  },
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  scrollList: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  chipSelected: {
    borderWidth: 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chipText: {
    fontWeight: '500',
  },
  chipTextSelected: {
    fontWeight: '700',
  },
  errorText: {
    marginTop: 4,
    fontWeight: '500',
  },
});
