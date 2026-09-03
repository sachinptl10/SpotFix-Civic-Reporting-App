import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { COLORS, BORDER_RADIUS, FONT_SIZES, SPACING } from '../utils/constants';

export default function PermissionCard({
  icon = 'shield-alert-outline',
  title = 'Permission Required',
  description = 'SpotFix requires this permission to provide full functionality.',
  onRequestPermission,
  buttonTitle = 'Grant Permission',
  showSettingsButton = true,
  style,
}) {
  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={44} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.buttonGroup}>
        {onRequestPermission && (
          <CustomButton
            title={buttonTitle}
            onPress={onRequestPermission}
            variant="primary"
            size="md"
            style={styles.actionButton}
          />
        )}

        {showSettingsButton && (
          <CustomButton
            title="Open Device Settings"
            onPress={openSettings}
            variant="outline"
            size="md"
            icon="cog-outline"
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    margin: SPACING.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  buttonGroup: {
    width: '100%',
    gap: SPACING.sm,
  },
  actionButton: {
    width: '100%',
  },
});
