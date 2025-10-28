// HomeScreen - Central hub for quick actions and overview
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function HomeScreen({ navigation }) {
  const { userProfile } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with icons */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Welcome back,</Text>
          <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Unread Messages</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Coming Soon", "Project creation will be available soon"); }}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.blue + '20' }]}>
                <Ionicons name="add-circle" size={28} color={COLORS.blue} />
              </View>
              <Text style={styles.actionText}>New Project</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Alert.alert("Coming Soon", "Photo upload will be available soon"); }}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.green + '20' }]}>
                <Ionicons name="camera" size={28} color={COLORS.green} />
              </View>
              <Text style={styles.actionText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coming Soon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  greeting: {
    marginBottom: SPACING.lg,
  },
  greetingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
  },
  name: {
    ...TYPOGRAPHY.title1,
    color: COLORS.label,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  statNumber: {
    ...TYPOGRAPHY.title1,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.label,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.label,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
});
