// Carben Connect Mobile 2.0 - Apple Design Theme System
// Based on Apple Human Interface Guidelines and APPLE_DESIGN_GUIDELINES.md

import { Platform } from 'react-native';

// SF Pro Typography System
export const TYPOGRAPHY = {
  // Large Titles - 34pt
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.374,
  },
  
  // Title 1 - 28pt
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.364,
  },
  
  // Title 2 - 22pt
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.352,
  },
  
  // Title 3 - 20pt
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  
  // Headline - 17pt Semibold
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.408,
  },
  
  // Body - 17pt Regular
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.408,
  },
  
  // Callout - 16pt
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  
  // Subheadline - 15pt
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  
  // Footnote - 13pt
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.078,
  },
  
  // Caption 1 - 12pt
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  
  // Caption 2 - 11pt
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.066,
  },
};

// iOS Semantic Colors - Light Mode
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
  primary: '#F97316', // Orange
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

// iOS Semantic Colors - Dark Mode
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

// Export colors (default to light mode, will be dynamic later)
export const COLORS = LIGHT_COLORS;
export const COLORS_DARK = DARK_COLORS;

// Spacing System (8pt grid)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// Shadows (iOS-style)
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5.46,
    elevation: 6,
  },
};

// Animation Timing (iOS-style)
export const ANIMATION = {
  // Duration in ms
  quick: 200,
  normal: 300,
  slow: 500,
  
  // Easing curves
  easeInOut: 'ease-in-out',
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Touch Target Sizes (44pt minimum)
export const TOUCH_TARGET = {
  min: 44,
  comfortable: 48,
  large: 56,
};

// Helper function to get theme based on mode
export const getTheme = (isDark = false) => ({
  colors: isDark ? DARK_COLORS : LIGHT_COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  animation: ANIMATION,
  touchTarget: TOUCH_TARGET,
});

export default {
  COLORS,
  COLORS_DARK,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATION,
  TOUCH_TARGET,
  getTheme,
};
