// HomeScreen - Central hub for quick actions and overview
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function HomeScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]} edges={['top']}>
      {/* Header with icons */}
      <View style={[styles.headerBar, { backgroundColor: colors.systemBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.label }]}>Home</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Calendar")}>
            <Ionicons name="calendar-outline" size={24} color={colors.label} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle-outline" size={24} color={colors.label} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: colors.secondaryLabel }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.label }]}>{userProfile?.name || 'User'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>Active Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>Unread Messages</Text>
          </View>
        </View>

        {/* Admin Quick Access - Drafts & Estimates */}
        {isAdmin() && (
          <TouchableOpacity 
            style={[styles.draftsBanner, { 
              backgroundColor: colors.secondarySystemGroupedBackground,
              borderColor: colors.primary 
            }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("Drafts");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.draftsBannerLeft}>
              <View style={styles.draftsBannerIcon}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
              <View style={styles.draftsBannerContent}>
                <Text style={[styles.draftsBannerTitle, { color: colors.label }]}>Drafts & Estimates</Text>
                <Text style={[styles.draftsBannerSubtitle, { color: colors.secondaryLabel }]}>
                  Create and manage project estimates
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.gray2} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.secondarySystemGroupedBackground }]} 
              onPress={() => { 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                navigation.navigate("NewProject"); 
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}>
                <Ionicons name="add-circle" size={28} color={colors.blue} />
              </View>
              <Text style={[styles.actionText, { color: colors.label }]}>New Project</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.secondarySystemGroupedBackground }]} 
              onPress={() => { 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                navigation.navigate("AddPhotos"); 
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(52, 199, 89, 0.2)' }]}>
                <Ionicons name="camera" size={28} color={colors.green} />
              </View>
              <Text style={[styles.actionText, { color: colors.label }]}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coming Soon */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>Recent Activity</Text>
          <View style={[styles.emptyState, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <Ionicons name="time-outline" size={48} color={colors.tertiaryLabel} />
            <Text style={[styles.emptyText, { color: colors.tertiaryLabel }]}>No recent activity</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.largeTitle,
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
  },
  name: {
    ...TYPOGRAPHY.title1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  statNumber: {
    ...TYPOGRAPHY.title1,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.footnote,
  },
  draftsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    ...SHADOWS.small,
  },
  draftsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  draftsBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftsBannerContent: {
    flex: 1,
  },
  draftsBannerTitle: {
    ...TYPOGRAPHY.headline,
    marginBottom: 2,
  },
  draftsBannerSubtitle: {
    ...TYPOGRAPHY.caption1,
    lineHeight: 16,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
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
    textAlign: 'center',
  },
  emptyState: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.sm,
  },
});
