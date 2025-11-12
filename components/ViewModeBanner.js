// ViewModeBanner - Shows when admin is viewing as a client
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const ViewModeBanner = () => {
  const { isViewingAsClient, viewingAsUser, exitViewAsClient } = useAuth();
  const insets = useSafeAreaInsets();

  if (!isViewingAsClient()) {
    return null;
  }

  const handleExitViewMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    exitViewAsClient();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Icon */}
        <Ionicons name="eye" size={18} color={COLORS.white} style={styles.icon} />

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Viewing as Client</Text>
          <Text style={styles.subtitle}>
            {viewingAsUser?.name || 'Unknown Client'}
          </Text>
        </View>

        {/* Exit Button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExitViewMode}
          activeOpacity={0.7}
        >
          <Text style={styles.exitText}>Exit</Text>
          <Ionicons name="close" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.carbenOrange,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 40,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  subtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.white,
    opacity: 0.8,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  exitText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: COLORS.white,
    marginRight: 4,
  },
});

export default ViewModeBanner;
