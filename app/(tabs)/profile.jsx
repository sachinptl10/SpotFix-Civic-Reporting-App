import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import CustomButton from '../../components/CustomButton';
import { getUserInitials } from '../../utils/helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { stats, fetchStats } = useReports();
  const { themeMode, setThemeMode, colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of SpotFix?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            toast.showInfo('You have logged out.');
            router.replace('/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Profile Information',
      `Full Name: ${user?.name}\nEmail: ${user?.email}\nJoined: ${new Date(user?.createdAt || Date.now()).toLocaleDateString()}`
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={[styles.avatarLarge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary }]}>
          <Text style={[styles.avatarLargeText, { color: colors.primary, fontSize: fontSizes.xxl }]}>
            {getUserInitials(user?.name)}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
          {user?.name || 'SpotFix Citizen'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
          {user?.email || 'citizen@spotfix.org'}
        </Text>

        <View style={[styles.badgeRole, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
          <Text style={[styles.badgeRoleText, { color: colors.primary, fontSize: fontSizes.xs }]}>
            Verified Community Reporter
          </Text>
        </View>
      </View>

      {/* Activity Overview Stats */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
        Civic Activity Overview
      </Text>

      <View style={styles.statsGrid}>
        {/* Total Reports */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            {stats?.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Total Reports
          </Text>
        </View>

        {/* Resolved Reports */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.success} />
          </View>
          <Text style={[styles.statNumber, { color: colors.success, fontSize: fontSizes.xl }]}>
            {stats?.resolved || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Resolved
          </Text>
        </View>

        {/* In Progress / Pending */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
            <MaterialCommunityIcons name="progress-clock" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statNumber, { color: colors.warning, fontSize: fontSizes.xl }]}>
            {stats?.pending || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            In Progress
          </Text>
        </View>
      </View>

      {/* Appearance Settings Section */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
        Appearance
      </Text>

      <View
        style={[
          styles.themeSelectorCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <View style={styles.themeOptionsRow}>
          {[
            { id: 'light', label: 'Light', icon: 'white-balance-sunny' },
            { id: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
            { id: 'system', label: 'System', icon: 'cellphone' },
          ].map((item) => {
            const isSelected = themeMode === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setThemeMode(item.id)}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontSize: fontSizes.xs,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Account Settings Actions */}
      <View style={styles.actionsContainer}>
        <CustomButton
          title="Account Details"
          onPress={handleEditProfile}
          variant="secondary"
          size="lg"
          icon="account-details-outline"
        />

        <CustomButton
          title="Log Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          icon="logout"
        />
      </View>

      {/* App Version Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.textMuted }]}>
          SpotFix Mobile v1.0.0 (SDK 54)
        </Text>
        <Text style={[styles.appInfoSubtext, { color: colors.textMuted }]}>
          Civic Technology for Modern Communities
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarLarge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  avatarLargeText: {
    fontWeight: '800',
  },
  userName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    marginBottom: 12,
  },
  badgeRole: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeRoleText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  themeSelectorCard: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {},
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  appInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appInfoSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
});
