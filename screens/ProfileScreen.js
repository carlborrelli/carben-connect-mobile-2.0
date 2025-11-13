// ProfileScreen - View and edit user profile
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import ClientSelectorModal from '../components/ClientSelectorModal';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin, isRealAdmin, signOut, viewAsClient, exitViewAsClient, isViewingAsClient } = useAuth();
  const [showClientSelector, setShowClientSelector] = useState(false);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const handleViewAsClient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowClientSelector(true);
  };

  const handleSelectClient = async (client) => {
    setShowClientSelector(false);

    const result = await viewAsClient(client.id);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate back to home to show client view
      navigation.navigate('Home');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', result.error || 'Failed to switch to client view');
    }
  };

  const handleExitClientView = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    exitViewAsClient();
    navigation.navigate('Home');
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={colors.secondaryLabel} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
          {isAdmin() && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          <View style={styles.card}>
            <InfoRow 
              icon="mail-outline" 
              label="Email" 
              value={userProfile?.email}
            />
            <View style={styles.separator} />
            <InfoRow 
              icon="briefcase-outline" 
              label="Role" 
              value={isAdmin() ? 'Administrator' : 'Client'}
            />
            {userProfile?.phone && (
              <>
                <View style={styles.separator} />
                <InfoRow 
                  icon="call-outline" 
                  label="Phone" 
                  value={userProfile.phone}
                />
              </>
            )}
          </View>
        </View>

        {/* QuickBooks Info (if exists) */}
        {userProfile?.quickbooksCustomerId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICKBOOKS</Text>
            <View style={styles.card}>
              <InfoRow 
                icon="business-outline" 
                label="Customer ID" 
                value={userProfile.quickbooksCustomerId}
              />
              {userProfile?.qbLocationName && (
                <>
                  <View style={styles.separator} />
                  <InfoRow 
                    icon="location-outline" 
                    label="Location" 
                    value={userProfile.qbLocationName}
                  />
                </>
              )}
            </View>
          </View>
        )}

        {/* Legal & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL & SUPPORT</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('Privacy Policy button pressed');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('Navigating to PrivacyPolicy');
                navigation.navigate('PrivacyPolicy');
                console.log('Navigation called');
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondaryLabel} />
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                console.log('Terms of Service button pressed');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log('Navigating to TermsOfService');
                navigation.navigate('TermsOfService');
                console.log('Navigation called');
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="document-text-outline" size={20} color={colors.secondaryLabel} />
                <Text style={styles.menuItemText}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {/* Exit Client View Button (When viewing as client) */}
          {isViewingAsClient() && (
            <TouchableOpacity style={styles.exitViewButton} onPress={handleExitClientView}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.exitViewText}>Exit Client View</Text>
            </TouchableOpacity>
          )}

          {/* View as Client Button (Admin Only, not in client view) */}
          {isRealAdmin() && !isViewingAsClient() && (
            <TouchableOpacity style={styles.viewAsClientButton} onPress={handleViewAsClient}>
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
              <Text style={styles.viewAsClientText}>View as Client</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryLabel} />
            </TouchableOpacity>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, (isRealAdmin() || isViewingAsClient()) && { marginTop: SPACING.sm }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Client Selector Modal */}
      <ClientSelectorModal
        visible={showClientSelector}
        onClose={() => setShowClientSelector(false)}
        onSelectClient={handleSelectClient}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.largeTitle,
    color: colors.systemBackground,
    fontWeight: '700',
    fontSize: 48,
  },
  name: {
    ...TYPOGRAPHY.title1,
    color: colors.label,
    marginBottom: SPACING.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: RADIUS.sm,
  },
  adminText: {
    ...TYPOGRAPHY.caption1,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 56,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: SPACING.md + 20 + SPACING.sm,
  },
  exitViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.primary + '20',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  exitViewText: {
    ...TYPOGRAPHY.headline,
    color: colors.primary,
    fontWeight: '600',
  },
  viewAsClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: colors.primary + '10',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  viewAsClientText: {
    ...TYPOGRAPHY.headline,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.red + '10',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  signOutText: {
    ...TYPOGRAPHY.headline,
    color: colors.red,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  menuItemText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
});
