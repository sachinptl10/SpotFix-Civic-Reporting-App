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
import { validateRegistration } from '../utils/validation';
import { getErrorMessage } from '../utils/helpers';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeServerHost, setActiveServerHostState] = useState('');

  useEffect(() => {
    getActiveServerHost().then((host) => setActiveServerHostState(host));
  }, []);

  const handleRegister = async () => {
    setServerError('');
    const validation = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      toast.showSuccess('Account created! Welcome to SpotFix.');
      router.replace('/(tabs)/home');
    } catch (err) {
      console.warn('[Register] Submission error:', err);
      const message = getErrorMessage(err, 'Failed to create account. Please try again.');
      if (err.errors) {
        setErrors(err.errors);
      }
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
          <View style={[styles.logoSquare, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="account-plus" size={30} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.primary, fontSize: fontSizes.xl }]}>
            SpotFix Citizen Registry
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Create your account to submit and track local civic issues
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.xl,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Report issues in your neighborhood
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
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            error={errors.name}
            autoCapitalize="words"
            leftIcon="account-outline"
          />

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
            placeholder="At least 6 characters"
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

          <CustomInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            error={errors.confirmPassword}
            secureTextEntry
            autoCapitalize="none"
            leftIcon="lock-check-outline"
          />

          <CustomButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* Switch to Login */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/login')}
            accessibilityRole="link"
          >
            <Text style={[styles.footerLink, { color: colors.primary, fontSize: fontSizes.sm }]}>
              Sign in
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
    paddingTop: 36,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSquare: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandTagline: {
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
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
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {},
  footerLink: {
    fontWeight: '700',
  },
  serverPillWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
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
