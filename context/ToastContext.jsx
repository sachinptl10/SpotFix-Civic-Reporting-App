import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' | 'warning', duration }
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (message, type = 'info', duration = 3500) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setToast({ message, type });

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + (Platform.OS === 'ios' ? 8 : 16),
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [insets.top, translateY, opacity, hideToast]
  );

  const showSuccess = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const showError = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const showWarning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const showInfo = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  const getToastStyle = () => {
    switch (toast?.type) {
      case 'success':
        return {
          backgroundColor: '#ECFDF5',
          borderColor: '#10B981',
          textColor: '#065F46',
          icon: 'check-circle-outline',
          iconColor: '#10B981',
        };
      case 'error':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#EF4444',
          textColor: '#991B1B',
          icon: 'alert-circle-outline',
          iconColor: '#EF4444',
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#F59E0B',
          textColor: '#92400E',
          icon: 'alert-outline',
          iconColor: '#F59E0B',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#3B82F6',
          textColor: '#1E40AF',
          icon: 'information-outline',
          iconColor: '#3B82F6',
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}

      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
              opacity,
              backgroundColor: toastStyle.backgroundColor,
              borderColor: toastStyle.borderColor,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={hideToast}
            style={styles.toastInner}
          >
            <MaterialCommunityIcons
              name={toastStyle.icon}
              size={22}
              color={toastStyle.iconColor}
              style={{ marginRight: spacing.sm }}
            />
            <Text
              style={[
                styles.toastText,
                { color: toastStyle.textColor, fontSize: fontSizes.sm },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={toastStyle.textColor}
              style={{ marginLeft: spacing.xs, opacity: 0.6 }}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      hideToast: () => {},
    };
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toastText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
});
