// MoreScreen - Settings and additional options
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function MoreScreen({ navigation }) {
  const { userProfile, isAdmin, signOut } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();
  const styles = createStyles(colors);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const MenuItem = ({ icon, title, onPress, color = colors.label, badge, showCheck }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {showCheck ? (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
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

        {/* Appearance Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="phone-portrait-outline"
              title="Automatic (System)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode('automatic');
              }}
              showCheck={themeMode === 'automatic'}
            />
            <View style={styles.separator} />
            <MenuItem
              icon="sunny-outline"
              title="Light Mode"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode('light');
              }}
              showCheck={themeMode === 'light'}
            />
            <View style={styles.separator} />
            <MenuItem
              icon="moon-outline"
              title="Dark Mode"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode('dark');
              }}
              showCheck={themeMode === 'dark'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" title="Profile" onPress={() => {}} />
            <View style={styles.separator} />
            <MenuItem
              icon="people-outline"
              title="Clients"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Clients");
              }}
            />
            <View style={styles.separator} />
            <MenuItem icon="settings-outline" title="Settings" onPress={() => navigation.navigate("Settings")} />
          </View>
        </View>
        {isAdmin() && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>ADMIN</Text>
            <View style={styles.menuCard}>
              <MenuItem 
                icon="document-text-outline" 
                title="Drafts & Estimates" 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Drafts");
                }} 
              />
              <View style={styles.separator} />
              <MenuItem icon="people-outline" title="User Management" onPress={() => navigation.navigate("UserManagement")} />
              <View style={styles.separator} />
              <MenuItem icon="business-outline" title="QuickBooks" onPress={() => navigation.navigate("QuickBooks")} />
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: colors.systemBackground,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: colors.label,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.title1,
    color: colors.systemBackground,
    fontWeight: '700',
  },
  profileName: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
  },
  adminBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: RADIUS.sm,
  },
  adminText: {
    ...TYPOGRAPHY.footnote,
    color: colors.primary,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
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
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...TYPOGRAPHY.caption2,
    color: colors.systemBackground,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: SPACING.md + 24 + SPACING.md,
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signOutText: {
    ...TYPOGRAPHY.headline,
    color: colors.red,
    fontWeight: '600',
  },
  version: {
    ...TYPOGRAPHY.caption1,
    color: colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
