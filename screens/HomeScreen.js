// HomeScreen - Central hub for quick actions and overview
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS, TAB_BAR_HEIGHT } from '../theme';
import GlowingCallButton from '../components/GlowingCallButton';
import ClientSummary from '../components/ClientSummary';
import BrandWelcomeHeader from '../components/BrandWelcomeHeader';

export default function HomeScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const { colors } = useTheme();
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [benPhone, setBenPhone] = useState(null);
  const [carlPhone, setCarlPhone] = useState(null);

  // Fetch active projects count
  useEffect(() => {
    if (!userProfile) return;

    let projectsQuery;
    if (isAdmin()) {
      // Admin sees all active projects
      projectsQuery = query(collection(db, 'projects'));
    } else {
      // Client sees only their projects
      projectsQuery = query(
        collection(db, 'projects'),
        where('clientId', '==', userProfile.id)
      );
    }

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      // Count projects that are not COMPLETE or PAID
      const activeCount = snapshot.docs.filter(doc => {
        const status = doc.data().status;
        return status !== 'COMPLETE' && status !== 'PAID';
      }).length;
      setActiveProjectsCount(activeCount);
    });

    return () => unsubscribe();
  }, [userProfile, isAdmin]);

  // Fetch unread messages count
  useEffect(() => {
    if (!userProfile) return;

    let messagesQuery;
    if (isAdmin()) {
      // Admin sees all unread messages
      messagesQuery = query(
        collection(db, 'messages'),
        where('unread', '==', true)
      );
    } else {
      // Client sees only their unread messages
      messagesQuery = query(
        collection(db, 'messages'),
        where('clientId', '==', userProfile.id),
        where('unread', '==', true)
      );
    }

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setUnreadMessagesCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [userProfile, isAdmin]);

  // Fetch phone numbers for Ben and Carl
  useEffect(() => {
    // Hardcoded phone numbers (avoiding Firestore permission issues)
    setBenPhone('6104056901');
    setCarlPhone('4849479597');
  }, []);

  const handleCall = (phoneNumber, name) => {
    if (!phoneNumber) {
      alert(`Phone number for ${name} not found`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phoneNumber}`);
  };

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Welcome Header */}
        <BrandWelcomeHeader clientName={userProfile?.name || 'User'} />

        {/* Content with padding */}
        <View style={styles.content}>
          {/* Call Buttons - Only show for clients */}
          {!isAdmin() && (
            <View style={styles.callButtonsContainer}>
            <GlowingCallButton
              title="CALL BEN"
              onPress={() => handleCall(benPhone, 'Ben')}
              style={styles.callButton}
              reverse={true}
            />
            <GlowingCallButton
              title="CALL CARL"
              onPress={() => handleCall(carlPhone, 'Carl')}
              style={styles.callButton}
            />
          </View>
        )}

        {/* Client Summary - Only show for clients */}
        {!isAdmin() && (
          <ClientSummary navigation={navigation} />
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{activeProjectsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>Active Projects</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{unreadMessagesCount}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>Unread Messages</Text>
          </View>
        </View>

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
  scrollContent: {
    paddingBottom: TAB_BAR_HEIGHT,
  },
  content: {
    padding: SPACING.lg,
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
  callButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  callButton: {
    flex: 1,
  },
});
