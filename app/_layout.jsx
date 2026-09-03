import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ReportProvider } from '../context/ReportContext';

function NavigationStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(government)" options={{ headerShown: false }} />
        <Stack.Screen
          name="report/camera"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="report/preview"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="report/create"
          options={{
            title: 'New Issue Report',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="report/[id]"
          options={{
            title: 'Report Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="government/report/[id]"
          options={{
            title: 'Review Civic Report',
            headerBackTitle: 'Queue',
          }}
        />
        <Stack.Screen
          name="edit/[id]"
          options={{
            title: 'Edit Report',
            headerBackTitle: 'Cancel',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <ReportProvider>
                <NavigationStack />
              </ReportProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
