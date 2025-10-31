// ThemeContext - Manages app theme with automatic dark mode support
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATION,
  TOUCH_TARGET,
} from '../theme';

// Light Mode Colors
const LIGHT_COLORS = {
  // System Colors
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  
  // Grouped Backgrounds
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  
  // Labels (Text)
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C43',
  quaternaryLabel: '#3C3C43',
  
  // Fills
  systemFill: 'rgba(120, 120, 128, 0.2)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.16)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.12)',
  quaternarySystemFill: 'rgba(116, 116, 128, 0.08)',
  
  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',
  
  // Link
  link: '#007AFF',
  
  // Carben Brand Colors
  primary: '#F97316',
  primaryLight: '#FB923C',
  primaryDark: '#EA580C',
  
  // System Colors
  blue: '#007AFF',
  green: '#34C759',
  indigo: '#5856D6',
  orange: '#FF9500',
  pink: '#FF2D55',
  purple: '#AF52DE',
  red: '#FF3B30',
  teal: '#5AC8FA',
  yellow: '#FFCC00',
  
  // Grays
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
};

// Dark Mode Colors
const DARK_COLORS = {
  // System Colors
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  
  // Grouped Backgrounds
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  
  // Labels (Text)
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF5',
  tertiaryLabel: '#EBEBF5',
  quaternaryLabel: '#EBEBF5',
  
  // Fills
  systemFill: 'rgba(120, 120, 128, 0.36)',
  secondarySystemFill: 'rgba(120, 120, 128, 0.32)',
  tertiarySystemFill: 'rgba(118, 118, 128, 0.24)',
  quaternarySystemFill: 'rgba(118, 118, 128, 0.18)',
  
  // Separators
  separator: 'rgba(84, 84, 88, 0.6)',
  opaqueSeparator: '#38383A',
  
  // Link
  link: '#0A84FF',
  
  // Carben Brand Colors (adjusted for dark mode)
  primary: '#FB923C',
  primaryLight: '#FDBA74',
  primaryDark: '#F97316',
  
  // System Colors
  blue: '#0A84FF',
  green: '#30D158',
  indigo: '#5E5CE6',
  orange: '#FF9F0A',
  pink: '#FF375F',
  purple: '#BF5AF2',
  red: '#FF453A',
  teal: '#64D2FF',
  yellow: '#FFD60A',
  
  // Grays
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',
};

const THEME_STORAGE_KEY = '@carben_theme_mode';

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('automatic');

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['automatic', 'light', 'dark'].includes(saved)) {
          setThemeMode(saved);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Function to update theme mode
  const setThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'automatic'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = {
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    shadows: SHADOWS,
    animation: ANIMATION,
    touchTarget: TOUCH_TARGET,
    isDark,
    themeMode,
    setThemeMode: setThemePreference,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
