// UserEditScreen - Edit individual user details
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function UserEditScreen({ navigation, route }) {
  const { userId } = route.params;
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quickbooksCustomerId, setQuickbooksCustomerId] = useState('');

  // Load user data
  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUser(userData);
        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setQuickbooksCustomerId(userData.quickbooksCustomerId || '');
      } else {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await updateDoc(doc(db, 'users', userId), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        quickbooksCustomerId: quickbooksCustomerId.trim(),
        updatedAt: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'User updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating user:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordResetEmail = () => {
    Alert.alert(
      'Send Password Reset Email',
      `Send a password reset link to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await sendPasswordResetEmail(auth, email);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Email Sent',
                `A password reset link has been sent to ${email}`
              );
            } catch (error) {
              console.error('Error sending password reset email:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

              let errorMessage = 'Failed to send password reset email';
              if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account exists with this email address';
              } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
              }

              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      `Enter new password for ${name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Password',
          onPress: async (newPassword) => {
            // Validation
            if (!newPassword || newPassword.length < 6) {
              Alert.alert('Validation Error', 'Password must be at least 6 characters');
              return;
            }

            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Call Cloud Function
              const changeUserPassword = httpsCallable(functions, 'changeUserPassword');
              const result = await changeUserPassword({
                userId: userId,
                newPassword: newPassword
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Success',
                `Password has been changed for ${name}`
              );
            } catch (error) {
              console.error('Error changing password:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

              let errorMessage = 'Failed to change password';
              if (error.code === 'functions/permission-denied') {
                errorMessage = 'You do not have permission to change passwords';
              } else if (error.code === 'functions/not-found') {
                errorMessage = 'User not found';
              } else if (error.code === 'functions/invalid-argument') {
                errorMessage = error.message || 'Invalid password';
              } else if (error.code === 'functions/unauthenticated') {
                errorMessage = 'You must be logged in to perform this action';
              }

              Alert.alert('Error', errorMessage);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleDeleteUser = () => {
    if (userId === userProfile?.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await deleteDoc(doc(db, 'users', userId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting user:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit User</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isCurrentUser = userId === userProfile?.id;
  const isAdminUser = user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit User</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, isAdminUser && styles.avatarAdmin]}>
              <Text style={styles.avatarText}>
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>You</Text>
              </View>
            )}
            {isAdminUser && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>

          {/* User Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>USER INFORMATION</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                  placeholderTextColor={colors.tertiaryLabel}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  placeholderTextColor={colors.tertiaryLabel}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.tertiaryLabel}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>QuickBooks Customer ID</Text>
                <TextInput
                  style={styles.input}
                  value={quickbooksCustomerId}
                  onChangeText={setQuickbooksCustomerId}
                  placeholder="Enter QB Customer ID"
                  placeholderTextColor={colors.tertiaryLabel}
                />
              </View>
            </View>
          </View>

          {/* Account Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChangePassword}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="key-outline" size={24} color={colors.primary} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Change Password</Text>
                    <Text style={styles.actionSubtitle}>
                      Set a new password for this user directly
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSendPasswordResetEmail}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="mail-outline" size={24} color={colors.blue} />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Send Password Reset Email</Text>
                    <Text style={styles.actionSubtitle}>
                      User will receive a link to reset their password
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          {!isCurrentUser && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DANGER ZONE</Text>
              <View style={styles.card}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleDeleteUser}
                >
                  <View style={styles.actionLeft}>
                    <Ionicons name="trash-outline" size={24} color={colors.red} />
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: colors.red }]}>
                        Delete User
                      </Text>
                      <Text style={styles.actionSubtitle}>
                        Permanently remove this user account
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    ...TYPOGRAPHY.body,
    color: colors.primary,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
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
  avatarAdmin: {
    backgroundColor: colors.orange,
  },
  avatarText: {
    ...TYPOGRAPHY.largeTitle,
    color: colors.systemBackground,
    fontWeight: '700',
    fontSize: 42,
  },
  youBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: colors.blue + '20',
    borderRadius: RADIUS.sm,
  },
  youText: {
    ...TYPOGRAPHY.footnote,
    color: colors.blue,
    fontWeight: '700',
  },
  adminBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: colors.orange + '20',
    borderRadius: RADIUS.sm,
  },
  adminText: {
    ...TYPOGRAPHY.footnote,
    color: colors.orange,
    fontWeight: '700',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  inputGroup: {
    padding: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    paddingVertical: SPACING.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
  },
});
