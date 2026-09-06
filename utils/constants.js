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
    label: 'Pending',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'clock-outline',
  },
  'under_review': {
    label: 'Under Review',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    icon: 'progress-clock',
  },
  'approved': {
    label: 'Approved',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    icon: 'check-decagram-outline',
  },
  'resolved': {
    label: 'Resolved',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: 'check-circle-outline',
  },
  'rejected': {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
  'Pending': {
    label: 'Pending',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'clock-outline',
  },
  'Submitted': {
    label: 'Pending',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    icon: 'clock-outline',
  },
  'In Progress': {
    label: 'In Progress',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: 'progress-clock',
  },
  'Under Review': {
    label: 'In Progress',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: 'progress-clock',
  },
  'Resolved': {
    label: 'Resolved',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: 'check-circle-outline',
  },
  'Rejected': {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: 'close-circle-outline',
  },
};

export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  accent: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',

  // Neutrals / Light Theme
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: '#0F172A',
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
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};
