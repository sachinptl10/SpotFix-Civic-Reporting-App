import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { useTheme } from '../theme/ThemeContext';

export default function EmptyState({
  icon = 'clipboard-text-outline',
  title = 'No reports yet',
  subtitle = 'Spotted a local problem?\nCreate your first report to notify local authorities.',
  buttonTitle,
  onButtonPress,
  style,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          marginVertical: spacing.md,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.surfaceSubtle,
            marginBottom: spacing.md,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={44} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: fontSizes.lg,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: colors.textSecondary,
            fontSize: fontSizes.sm,
            marginBottom: spacing.lg,
            paddingHorizontal: spacing.sm,
          },
        ]}
      >
        {subtitle}
      </Text>

      {buttonTitle && onButtonPress && (
        <CustomButton
          title={buttonTitle}
          onPress={onButtonPress}
          variant="primary"
          size="md"
          icon="plus"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    minWidth: 180,
  },
});
