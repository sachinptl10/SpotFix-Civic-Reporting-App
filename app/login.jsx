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
      await login(email.trim(), password);
      toast.showSuccess('Welcome back to SpotFix!');
      router.replace('/(tabs)/home');
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
    marginTop: 28,
  },
  footerText: {},
  footerLink: {
    fontWeight: '700',
  },
});
