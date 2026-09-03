import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const isInteractive = !disabled && !loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: colors.textPrimary },
          indicatorColor: colors.textPrimary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          },
          text: { color: colors.primary },
          indicatorColor: colors.primary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.danger,
          },
          text: { color: '#FFFFFF' },
          indicatorColor: '#FFFFFF',
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: colors.primary },
          indicatorColor: colors.primary,
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: { color: '#FFFFFF' },
          indicatorColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 34 },
          text: { fontSize: fontSizes.xs },
          iconSize: 16,
        };
      case 'lg':
        return {
          container: { paddingVertical: 15, paddingHorizontal: 24, minHeight: 54 },
          text: { fontSize: fontSizes.md },
          iconSize: 22,
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48 },
          text: { fontSize: fontSizes.sm },
          iconSize: 18,
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.baseButton,
        { borderRadius: borderRadius.md },
        variantStyle.container,
        sizeStyle.container,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text.color}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[styles.baseText, variantStyle.text, sizeStyle.text, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text.color}
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
