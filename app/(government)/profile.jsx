import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import CustomButton from '../../components/CustomButton';

export default function GovernmentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const handleLogout = () => {
    Alert.alert(
      'Log Out Official Portal',
      'Are you sure you want to log out of the SpotFix Government Management Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            toast.showInfo('Logged out from Government portal.');
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Officer Credential Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.surface,
            borderColor: '#0284C7',
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.badgeShieldCircle}>
          <MaterialCommunityIcons name="shield-account" size={44} color="#0284C7" />
        </View>

        <Text style={[styles.officerName, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
          {user?.name || 'Municipal Review Officer'}
        </Text>

        <Text style={[styles.officerEmail, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
          {user?.email || 'gov@spotfix.gov'}
        </Text>

        <View style={styles.roleTag}>
          <MaterialCommunityIcons name="check-decagram" size={14} color="#0284C7" />
          <Text style={styles.roleTagText}>Authorized Government Official</Text>
        </View>

        <View style={[styles.deptInfoBox, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.md }]}>
          <Text style={[styles.deptLabel, { color: colors.textMuted }]}>Assigned Department</Text>
          <Text style={[styles.deptValue, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
            Department of Public Works & Civic Maintenance
          </Text>
        </View>
      </View>

      {/* Appearance Setting */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
        Appearance
      </Text>
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <View style={styles.themeRow}>
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
                  styles.themeBtn,
                  {
                    backgroundColor: isSelected ? '#0284C7' : colors.surfaceSubtle,
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
                    styles.themeText,
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

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <CustomButton
          title="Review Queue"
          onPress={() => router.push('/(government)/queue')}
          variant="secondary"
          size="lg"
          icon="clipboard-list-outline"
        />

        <CustomButton
          title="Municipal Analytics"
          onPress={() => router.push('/(government)/analytics')}
          variant="secondary"
          size="lg"
          icon="chart-box-outline"
        />

        <CustomButton
          title="Log Out"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          icon="logout"
        />
      </View>

      <View style={styles.footerInfo}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          SpotFix Government Suite v2.0 (Official Release)
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
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  badgeShieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  officerName: {
    fontWeight: '800',
    marginBottom: 2,
  },
  officerEmail: {
    marginBottom: 10,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 14,
  },
  roleTagText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 12,
  },
  deptInfoBox: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
  },
  deptLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  deptValue: {
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  themeCard: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeText: {},
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
