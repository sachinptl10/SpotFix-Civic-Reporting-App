import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';
import { SPACING, BORDER_RADIUS } from './spacing';
import { FONT_SIZES, FONT_WEIGHTS } from './typography';

const THEME_STORAGE_KEY = '@spotfix_theme_preference';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'light' | 'dark' | 'system'
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.warn('[ThemeContext] Failed to load saved theme:', e);
      } finally {
        setIsReady(true);
      }
    };
    loadSavedTheme();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('[ThemeContext] Failed to persist theme:', e);
    }
  };

  // Determine active theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        colors,
        spacing: SPACING,
        borderRadius: BORDER_RADIUS,
        fontSizes: FONT_SIZES,
        fontWeights: FONT_WEIGHTS,
        isReady,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      themeMode: 'light',
      setThemeMode: () => {},
      isDark: false,
      colors: lightColors,
      spacing: SPACING,
      borderRadius: BORDER_RADIUS,
      fontSizes: FONT_SIZES,
      fontWeights: FONT_WEIGHTS,
    };
  }
  return context;
};

export default ThemeContext;
