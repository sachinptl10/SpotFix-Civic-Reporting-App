import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import useToast from '../hooks/useToast';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import ServerConfigModal from '../components/ServerConfigModal';
import { getActiveServerHost } from '../services/api';
import { validateLogin } from '../utils/validation';
import { getErrorMessage } from '../utils/helpers';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeServerHost, setActiveServerHostState] = useState('');

  useEffect(() => {
    getActiveServerHost().then((host) => setActiveServerHostState(host));
  }, []);

  const handleLogin = async () => {
    setServerError('');
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const data = await login(email.trim(), password);
      toast.showSuccess(`Welcome back to SpotFix${data?.user?.role === 'government' ? ' Government Portal' : ''}!`);
      if (data?.user?.role === 'government') {
        router.replace('/(government)/queue');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      console.warn('[Login] Submission error:', err);
      const message = getErrorMessage(err, 'Failed to log in. Please check your credentials.');
      setServerError(message);
      toast.showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <MaterialCommunityIcons name="shield-check" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.primary, fontSize: fontSizes.title }]}>
            SpotFix
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Report. Track. Resolve.
          </Text>
        </View>

        {/* Card Form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Sign in to access your civic issue reports
          </Text>

          {serverError ? (
            <View style={[styles.serverErrorBox, { borderRadius: borderRadius.md }]}>
              <View style={styles.errorRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={[styles.serverErrorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
                  {serverError}
                </Text>
              </View>
              {(serverError.includes('reach') || serverError.includes('connection') || serverError.includes('server')) && (
                <TouchableOpacity
                  onPress={() => setIsConfigModalOpen(true)}
                  style={[styles.serverFixBtn, { backgroundColor: '#FEE2E2', borderRadius: borderRadius.sm }]}
                >
                  <MaterialCommunityIcons name="server-network" size={14} color="#B91C1C" style={{ marginRight: 6 }} />
                  <Text style={styles.serverFixBtnText}>Diagnose & Fix Server Connection</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <CustomInput
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="email-outline"
          />

          <CustomInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            leftIcon="lock-outline"
          />

          {/* Quick Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={[styles.demoTitle, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
              QUICK TEST CREDENTIALS:
            </Text>
            <View style={styles.demoPillsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setEmail('admin@spotfix.gov');
                  setPassword('password123');
                  setErrors({});
                  setServerError('');
                }}
                style={[styles.demoPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
              >
                <MaterialCommunityIcons name="shield-account" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={[styles.demoPillText, { color: '#1D4ED8', fontSize: fontSizes.xs }]}>
                  Gov Official
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setEmail('user@spotfix.com');
                  setPassword('password123');
                  setErrors({});
                  setServerError('');
                }}
                style={[styles.demoPill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
              >
                <MaterialCommunityIcons name="account" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={[styles.demoPillText, { color: '#15803D', fontSize: fontSizes.xs }]}>
                  Citizen
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* Switch to Register */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Don't have an account yet?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/register')}
            accessibilityRole="link"
          >
            <Text style={[styles.footerLink, { color: colors.primary, fontSize: fontSizes.sm }]}>
              Register now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server Connection Indicator Pill */}
        <View style={styles.serverPillWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsConfigModalOpen(true)}
            style={[
              styles.serverPill,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <View style={styles.serverDot} />
            <Text style={[styles.serverPillText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
              Backend: {activeServerHost || 'Detecting...'}
            </Text>
            <MaterialCommunityIcons name="cog-outline" size={15} color={colors.textSecondary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Server Configuration & Diagnostic Modal */}
      <ServerConfigModal
        visible={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={(newHost) => {
          setActiveServerHostState(newHost);
          setServerError('');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  brandName: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 20,
  },
  serverErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serverErrorText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  serverFixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  serverFixBtnText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
  demoSection: {
    marginVertical: 12,
  },
  demoTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  demoPillText: {
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {},
  footerLink: {
    fontWeight: '700',
  },
  serverPillWrapper: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  serverDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  serverPillText: {
    fontWeight: '600',
  },
});
