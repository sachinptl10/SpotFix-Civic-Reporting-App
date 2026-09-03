import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { useTheme } from '../theme/ThemeContext';

export default function ErrorState({
  title = 'Something Went Wrong',
  message = 'We encountered an error while loading data. Please check your connection and try again.',
  onRetry,
  retryTitle = 'Try Again',
  style,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.danger,
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
            backgroundColor: '#FEF2F2',
            marginBottom: spacing.md,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-octagon-outline"
          size={40}
          color={colors.danger}
        />
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: fontSizes.md,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: colors.textSecondary,
            fontSize: fontSizes.sm,
            marginBottom: spacing.md,
          },
        ]}
      >
        {message}
      </Text>

      {onRetry && (
        <CustomButton
          title={retryTitle}
          onPress={onRetry}
          variant="outline"
          size="md"
          icon="reload"
          style={styles.retryButton}
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
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  retryButton: {
    minWidth: 140,
  },
});
