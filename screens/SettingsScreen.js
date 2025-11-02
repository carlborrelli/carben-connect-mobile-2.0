// SettingsScreen - App settings and preferences
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleToggle = (setter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(prev => !prev);
  };

  const SettingItem = ({ icon, title, subtitle, type = 'link', value, onValueChange, onPress }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={type === 'link' ? onPress : null}
      activeOpacity={type === 'link' ? 0.7 : 1}
      disabled={type !== 'link'}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={() => {
            handleToggle(onValueChange);
          }}
          trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
          thumbColor={value ? colors.primary : colors.systemBackground}
        />
      )}
      {type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
      )}
    </TouchableOpacity>
  );

  const handleClearCache = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This may improve performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleReportBug = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Report a Bug',
      'Please email support@carbenconnect.com with details about the issue.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="person-outline"
              title="Account Information"
              subtitle={userProfile?.email}
              type="link"
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="notifications-outline"
              title="All Notifications"
              subtitle="Enable or disable all notifications"
              type="switch"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="mail-outline"
              title="Email Notifications"
              subtitle="Receive updates via email"
              type="switch"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="phone-portrait-outline"
              title="Push Notifications"
              subtitle="Receive push notifications"
              type="switch"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up storage space"
              type="link"
              onPress={handleClearCache}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="bug-outline"
              title="Report a Bug"
              subtitle="Help us improve the app"
              type="link"
              onPress={handleReportBug}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="information-circle-outline"
              title="App Version"
              subtitle="2.0.0"
              type="link"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="document-text-outline"
              title="Privacy Policy"
              type="link"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Terms of Service"
              type="link"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2025 Carben Connect. All rights reserved.
        </Text>
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
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 56,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  settingSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: SPACING.md + 24 + SPACING.md,
  },
  footer: {
    ...TYPOGRAPHY.caption2,
    color: colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
});
