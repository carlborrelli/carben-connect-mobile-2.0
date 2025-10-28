// ProfileScreen - View and edit user profile
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { userProfile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color={COLORS.secondaryLabel} />
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
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
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
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
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

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.systemBackground,
    fontWeight: '700',
    fontSize: 48,
  },
  name: {
    ...TYPOGRAPHY.title1,
    color: COLORS.label,
    marginBottom: SPACING.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
    borderRadius: RADIUS.sm,
  },
  adminText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
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
    color: COLORS.secondaryLabel,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: SPACING.md + 20 + SPACING.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.red + '10',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  signOutText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.red,
    fontWeight: '600',
  },
});
