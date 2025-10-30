// ClientDetailScreen - View client details and projects
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProjectCard from '../components/ProjectCard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ClientDetailScreen({ route, navigation }) {
  const { client } = route.params;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load projects for this client
  useEffect(() => {
    if (!client?.id) return;

    const projectsQuery = query(
      collection(db, 'projects'),
      where('clientId', '==', client.id)
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading projects:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [client?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleProjectPress = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Client Info Card */}
        <View style={styles.clientCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {client.name?.charAt(0)?.toUpperCase() || 'C'}
            </Text>
          </View>

          <Text style={styles.clientName}>{client.name || 'Unnamed Client'}</Text>

          {/* Contact Information */}
          <View style={styles.infoSection}>
            {client.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={COLORS.secondaryLabel} />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            )}

            {client.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={COLORS.secondaryLabel} />
                <Text style={styles.infoText}>{client.phone}</Text>
              </View>
            )}

            {client.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={COLORS.secondaryLabel} />
                <Text style={styles.infoText}>{client.address}</Text>
              </View>
            )}
          </View>

          {/* QuickBooks Information */}
          {(client.qbCustomers || client.qbCustomerId || client.qbLocationName) && (
            <View style={styles.qbSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={16} color={COLORS.secondaryLabel} />
                <Text style={styles.sectionTitle}>QuickBooks Info</Text>
              </View>

              {/* Multiple Locations */}
              {client.qbCustomers && client.qbCustomers.length > 1 && (
                <View style={styles.locationsContainer}>
                  <Text style={styles.qbLabel}>Locations:</Text>
                  {client.qbCustomers.map((qbCustomer, index) => (
                    <View key={qbCustomer.id || index} style={styles.locationItem}>
                      <Ionicons name="location" size={14} color={COLORS.primary} />
                      <Text style={styles.locationText}>{qbCustomer.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Single Location from qbCustomers array */}
              {client.qbCustomers && client.qbCustomers.length === 1 && (
                <View style={styles.qbRow}>
                  <Text style={styles.qbLabel}>Location:</Text>
                  <Text style={styles.qbValue}>{client.qbCustomers[0].name}</Text>
                </View>
              )}

              {/* Legacy: qbCustomerId */}
              {!client.qbCustomers && client.qbCustomerId && (
                <View style={styles.qbRow}>
                  <Text style={styles.qbLabel}>Customer ID:</Text>
                  <Text style={styles.qbValue}>{client.qbCustomerId}</Text>
                </View>
              )}

              {/* Legacy: qbLocationName */}
              {!client.qbCustomers && client.qbLocationName && (
                <View style={styles.qbRow}>
                  <Text style={styles.qbLabel}>Location:</Text>
                  <Text style={styles.qbValue}>{client.qbLocationName}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Projects Section */}
        <View style={styles.projectsSection}>
          <View style={styles.projectsHeader}>
            <Text style={styles.projectsTitle}>Projects</Text>
            <View style={styles.projectCount}>
              <Text style={styles.projectCountText}>{projects.length}</Text>
            </View>
          </View>

          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Projects for this client will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.projectsList}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={handleProjectPress}
                  client={client}
                  isAdmin={false}
                />
              ))}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
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
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.systemBackground,
    fontWeight: '700',
  },
  clientName: {
    ...TYPOGRAPHY.title1,
    color: COLORS.label,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    flex: 1,
  },
  qbSection: {
    width: '100%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
  },
  qbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  qbLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
  },
  qbValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    fontWeight: '500',
  },
  locationsContainer: {
    width: '100%',
    marginTop: SPACING.xs,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    paddingLeft: SPACING.md,
  },
  locationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    flex: 1,
  },
  projectsSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  projectsTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
  },
  projectCount: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  projectCountText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },
  projectsList: {
    gap: SPACING.md,
  },
  emptyState: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
