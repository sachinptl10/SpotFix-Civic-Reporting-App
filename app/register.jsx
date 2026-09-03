import React, { useState } from 'react';
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
          <View style={[styles.logoCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <MaterialCommunityIcons name="account-plus" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.primary, fontSize: fontSizes.xxl }]}>
            SpotFix
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Join our civic community
          </Text>
        </View>

        {/* Form Card */}
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
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
            Report issues in your neighborhood
          </Text>

          {serverError ? (
            <View style={[styles.serverErrorBox, { borderRadius: borderRadius.md }]}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={colors.danger}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.serverErrorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
                {serverError}
              </Text>
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
      </ScrollView>
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
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
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
    marginBottom: 16,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: {
    flex: 1,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {},
  footerLink: {
    fontWeight: '700',
  },
});
