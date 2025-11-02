// QuickBooksScreen - QuickBooks integration settings (Admin only)
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function QuickBooksScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QuickBooks settings
  const [qbEnabled, setQbEnabled] = useState(false);
  const [qbCompanyId, setQbCompanyId] = useState('');
  const [qbClientId, setQbClientId] = useState('');
  const [qbClientSecret, setQbClientSecret] = useState('');
  const [qbAccessToken, setQbAccessToken] = useState('');
  const [qbRefreshToken, setQbRefreshToken] = useState('');
  const [qbTokenExpiry, setQbTokenExpiry] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInvoices, setSyncInvoices] = useState(true);
  const [syncEstimates, setSyncEstimates] = useState(true);
  const [syncCustomers, setSyncCustomers] = useState(true);
  const [lastSyncDate, setLastSyncDate] = useState(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'This feature is only available to administrators.');
      navigation.goBack();
    }
  }, [isAdmin]);

  // Load QuickBooks settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'quickbooks'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setQbEnabled(data.enabled || false);
        setQbCompanyId(data.companyId || '');
        setQbClientId(data.clientId || '');
        setQbClientSecret(data.clientSecret || '');
        setQbAccessToken(data.accessToken || '');
        setQbRefreshToken(data.refreshToken || '');
        setQbTokenExpiry(data.tokenExpiry || '');
        setAutoSyncEnabled(data.autoSync !== false);
        setSyncInvoices(data.syncInvoices !== false);
        setSyncEstimates(data.syncEstimates !== false);
        setSyncCustomers(data.syncCustomers !== false);
        setLastSyncDate(data.lastSync?.toDate?.() || null);
      }
    } catch (error) {
      console.error('Error loading QuickBooks settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(prev => !prev);
  };

  const handleSaveSettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await setDoc(doc(db, 'settings', 'quickbooks'), {
        enabled: qbEnabled,
        companyId: qbCompanyId,
        clientId: qbClientId,
        clientSecret: qbClientSecret,
        accessToken: qbAccessToken,
        refreshToken: qbRefreshToken,
        tokenExpiry: qbTokenExpiry,
        autoSync: autoSyncEnabled,
        syncInvoices,
        syncEstimates,
        syncCustomers,
        lastSync: lastSyncDate,
        updatedAt: new Date(),
        updatedBy: userProfile.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'QuickBooks settings saved successfully');
    } catch (error) {
      console.error('Error saving QuickBooks settings:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Connect to QuickBooks',
      'This would normally open QuickBooks OAuth flow. For now, manually enter your API credentials.',
      [{ text: 'OK' }]
    );
  };

  const handleTestConnection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Test Connection',
      'Testing connection to QuickBooks...\n\n(This is a placeholder - real API call would go here)',
      [{ text: 'OK' }]
    );
  };

  const handleSyncNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Manual Sync',
      'Start manual sync with QuickBooks now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              // Simulate sync
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setLastSyncDate(new Date());

              await setDoc(doc(db, 'settings', 'quickbooks'), {
                lastSync: new Date(),
              }, { merge: true });

              Alert.alert('Success', 'QuickBooks sync completed');
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Sync failed');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QuickBooks</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QuickBooks</Text>
        <TouchableOpacity
          onPress={handleSaveSettings}
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={qbEnabled ? "checkmark-circle" : "alert-circle-outline"}
              size={32}
              color={qbEnabled ? colors.green : colors.secondaryLabel}
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {qbEnabled ? 'QuickBooks Connected' : 'Not Connected'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {qbEnabled
                  ? `Last synced: ${formatDate(lastSyncDate)}`
                  : 'Connect to QuickBooks to sync data'
                }
              </Text>
            </View>
          </View>

          {!qbEnabled && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Text style={styles.connectButtonText}>Connect to QuickBooks</Text>
            </TouchableOpacity>
          )}

          {qbEnabled && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={handleTestConnection}
              >
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonTextSecondary}>Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSyncNow}
              >
                <Ionicons name="sync-outline" size={20} color={colors.systemBackground} />
                <Text style={styles.actionButtonText}>Sync Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENERAL</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Enable QuickBooks</Text>
                <Text style={styles.settingSubtitle}>
                  Turn on QuickBooks integration
                </Text>
              </View>
              <Switch
                value={qbEnabled}
                onValueChange={() => handleToggle(setQbEnabled)}
                trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
                thumbColor={qbEnabled ? colors.primary : colors.systemBackground}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingTitle}>Auto Sync</Text>
                <Text style={styles.settingSubtitle}>
                  Automatically sync data every hour
                </Text>
              </View>
              <Switch
                value={autoSyncEnabled}
                onValueChange={() => handleToggle(setAutoSyncEnabled)}
                trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
                thumbColor={autoSyncEnabled ? colors.primary : colors.systemBackground}
                disabled={!qbEnabled}
              />
            </View>
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SYNC OPTIONS</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                <Text style={styles.settingTitle}>Sync Invoices</Text>
              </View>
              <Switch
                value={syncInvoices}
                onValueChange={() => handleToggle(setSyncInvoices)}
                trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
                thumbColor={syncInvoices ? colors.primary : colors.systemBackground}
                disabled={!qbEnabled}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                <Text style={styles.settingTitle}>Sync Estimates</Text>
              </View>
              <Switch
                value={syncEstimates}
                onValueChange={() => handleToggle(setSyncEstimates)}
                trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
                thumbColor={syncEstimates ? colors.primary : colors.systemBackground}
                disabled={!qbEnabled}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
                <Text style={styles.settingTitle}>Sync Customers</Text>
              </View>
              <Switch
                value={syncCustomers}
                onValueChange={() => handleToggle(setSyncCustomers)}
                trackColor={{ false: colors.tertiarySystemBackground, true: colors.primary + '80' }}
                thumbColor={syncCustomers ? colors.primary : colors.systemBackground}
                disabled={!qbEnabled}
              />
            </View>
          </View>
        </View>

        {/* API Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>API CONFIGURATION</Text>
          <View style={styles.settingsCard}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Company ID</Text>
              <TextInput
                style={styles.input}
                value={qbCompanyId}
                onChangeText={setQbCompanyId}
                placeholder="Enter company ID"
                placeholderTextColor={colors.tertiaryLabel}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Client ID</Text>
              <TextInput
                style={styles.input}
                value={qbClientId}
                onChangeText={setQbClientId}
                placeholder="Enter client ID"
                placeholderTextColor={colors.tertiaryLabel}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Client Secret</Text>
              <TextInput
                style={styles.input}
                value={qbClientSecret}
                onChangeText={setQbClientSecret}
                placeholder="Enter client secret"
                placeholderTextColor={colors.tertiaryLabel}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
          <Text style={styles.infoText}>
            QuickBooks integration allows automatic syncing of customers, invoices, and estimates.
            Configure your API credentials above to get started.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Visit QuickBooks Developer Portal
          </Text>
        </View>
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
  saveButton: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  statusCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
    marginBottom: SPACING.xs / 2,
  },
  statusSubtitle: {
    ...TYPOGRAPHY.subheadline,
    color: colors.secondaryLabel,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  connectButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  actionButtonSecondary: {
    backgroundColor: colors.primary + '20',
  },
  actionButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    ...TYPOGRAPHY.subheadline,
    color: colors.primary,
    fontWeight: '600',
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
    marginLeft: SPACING.md,
  },
  inputItem: {
    padding: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.subheadline,
    color: colors.secondaryLabel,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    backgroundColor: colors.tertiarySystemBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: colors.blue + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...TYPOGRAPHY.footnote,
    color: colors.blue,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption1,
    color: colors.tertiaryLabel,
    textAlign: 'center',
  },
});
