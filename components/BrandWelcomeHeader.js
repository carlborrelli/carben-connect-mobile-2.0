// BrandWelcomeHeader - Branded header with gradient accents
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BrandWelcomeHeader({ clientName = 'User' }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.welcomeText, { color: colors.secondaryLabel }]}>Welcome back,</Text>
        <Text style={[styles.clientName, { color: colors.label }]}>{clientName}</Text>
      </View>

      {/* Orange Gradient Lines (below name) */}
      <LinearGradient
        colors={['rgba(249, 115, 22, 0)', '#F97316', 'rgba(249, 115, 22, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.accentLine, styles.middleLine1]}
      />
      <LinearGradient
        colors={['rgba(249, 115, 22, 0)', '#F97316', 'rgba(249, 115, 22, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.accentLine, styles.middleLine2]}
      />

      {/* Blue Gradient Lines (at bottom) */}
      <LinearGradient
        colors={['rgba(59, 130, 246, 0)', '#3B82F6', 'rgba(59, 130, 246, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.accentLine, styles.blueAccentLine, styles.bottomLine1]}
      />
      <LinearGradient
        colors={['rgba(59, 130, 246, 0)', '#3B82F6', 'rgba(59, 130, 246, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.accentLine, styles.blueAccentLine, styles.bottomLine2]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 1,
  },
  welcomeText: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xs,
  },
  clientName: {
    ...TYPOGRAPHY.largeTitle,
    fontWeight: '700',
    textAlign: 'center',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  blueAccentLine: {
    left: '12.5%',
    right: '12.5%',
  },
  middleLine1: {
    bottom: 18,
  },
  middleLine2: {
    bottom: 14,
  },
  bottomLine1: {
    bottom: 8,
  },
  bottomLine2: {
    bottom: 4,
  },
});
