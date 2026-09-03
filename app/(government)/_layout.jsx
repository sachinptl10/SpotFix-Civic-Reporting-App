import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function GovernmentTabsLayout() {
  const { colors, fontSizes } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ],
        tabBarLabelStyle: [
          styles.tabBarLabel,
          { fontSize: fontSizes.tiny + 1 },
        ],
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Review Queue',
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'clipboard-text-search' : 'clipboard-text-search-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Civic Map',
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'map-marker-radius' : 'map-marker-radius-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Municipal Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-box' : 'chart-box-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Officer Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-shield' : 'account-shield-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontWeight: '700',
  },
});
