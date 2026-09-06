import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Automatically detects the development server host IP.
 * - Web: http://localhost:5000
 * - Expo Go / Mobile on Wi-Fi / Hotspot: Extracts current host IP from Metro bundler's hostUri
 * - Fallback: http://172.20.10.2:5000 (Current Personal Hotspot IP)
 */
export const detectDevServerHost = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.expoGoConfig?.debuggerHost ||
      Constants.manifest2?.extra?.expoClient?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000`;
      }
    }
  } catch (err) {
    console.warn('[Constants] Failed to auto-detect host IP:', err);
  }

  return 'http://172.20.10.2:5000';
};

export const SERVER_HOST = detectDevServerHost();

export const API_BASE_URL = `${SERVER_HOST}/api`;

export const CATEGORIES = [
  { id: 'Pothole', label: 'Pothole', icon: 'alert-circle-outline', color: '#EF4444' },
  { id: 'Garbage', label: 'Garbage Pile', icon: 'trash-can-outline', color: '#F59E0B' },
  { id: 'Broken Streetlight', label: 'Broken Streetlight', icon: 'lightbulb-off-outline', color: '#8B5CF6' },
  { id: 'Damaged Road', label: 'Damaged Road', icon: 'car-traction-control', color: '#EC4899' },
  { id: 'Water Leakage', label: 'Water Leakage', icon: 'water-outline', color: '#0EA5E9' },
  { id: 'Drainage Problem', label: 'Drainage Problem', icon: 'waves', color: '#06B6D4' },
  { id: 'Public Property Damage', label: 'Public Property Damage', icon: 'domain', color: '#6366F1' },
  { id: 'Other', label: 'Other Issue', icon: 'help-circle-outline', color: '#64748B' },
];

export const STATUS_CONFIG = {
  'pending': {
    label: 'Pending Review',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'clock-outline',
  },
  'under_review': {
    label: 'Under Review',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'progress-clock',
  },
  'approved': {
    label: 'Approved for Work',
    color: '#0E7490',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    icon: 'check-decagram-outline',
  },
  'resolved': {
    label: 'Work Completed',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: 'check-circle-outline',
  },
  'rejected': {
    label: 'Not Actionable',
    color: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
  'Pending': {
    label: 'Pending Review',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'clock-outline',
  },
  'Submitted': {
    label: 'Pending Review',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    icon: 'clock-outline',
  },
  'In Progress': {
    label: 'Under Review',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'progress-clock',
  },
  'Under Review': {
    label: 'Under Review',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'progress-clock',
  },
  'Resolved': {
    label: 'Work Completed',
    color: '#15803D',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    icon: 'check-circle-outline',
  },
  'Rejected': {
    label: 'Not Actionable',
    color: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
};

export const COLORS = {
  primary: '#153243',
  primaryDark: '#0E222E',
  primaryLight: '#284B63',
  accent: '#D97706',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#0284C7',
  success: '#15803D',

  // Neutrals / Slate Architecture
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.65)',
  cardShadow: 'rgba(15, 23, 42, 0.04)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FONT_SIZES = {
  tiny: 11,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};
