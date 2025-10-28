// MoreScreen - Settings and additional options
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function MoreScreen() {
  const { userProfile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const MenuItem = ({ icon, title, onPress, color = COLORS.label }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.tertiaryLabel} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
          {isAdmin() && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" title="Profile" onPress={() => {}} />
            <View style={styles.separator} />
            <MenuItem icon="settings-outline" title="Settings" onPress={() => {}} />
          </View>
        </View>

        {isAdmin() && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>ADMIN</Text>
            <View style={styles.menuCard}>
              <MenuItem icon="people-outline" title="User Management" onPress={() => {}} />
              <View style={styles.separator} />
              <MenuItem icon="business-outline" title="QuickBooks" onPress={() => {}} />
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="document-text-outline" title="Privacy Policy" onPress={() => {}} />
            <View style={styles.separator} />
            <MenuItem icon="shield-checkmark-outline" title="Terms of Service" onPress={() => {}} />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
  },
  title: {
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.title1,
    color: COLORS.systemBackground,
    fontWeight: '700',
  },
  profileName: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
  },
  adminBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
    borderRadius: RADIUS.sm,
  },
  adminText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 56,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: SPACING.md + 24 + SPACING.md,
  },
  signOutButton: {
    backgroundColor: COLORS.red + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signOutText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.red,
    fontWeight: '600',
  },
  version: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
