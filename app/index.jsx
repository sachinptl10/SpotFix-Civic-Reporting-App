import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import LoadingState from '../components/LoadingState';

export default function Index() {
  const { isLoading, isAuthenticated, isGovernment } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (isGovernment) {
          router.replace('/(government)/queue');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, isGovernment, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoadingState message="Loading SpotFix Civic Platform..." fullScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
