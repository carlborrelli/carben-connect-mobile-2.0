import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function DraftsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [estimateProgress, setEstimateProgress] = useState({});
  const [clients, setClients] = useState({});
  const [locations, setLocations] = useState({}); // Locations lookup by id
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'This feature is only available to administrators.');
      navigation.goBack();
      return;
    }

    // Listen to all projects (we'll filter for active ones)
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsData);
      setLoading(false);
    });

    // Listen to all estimate progress
    const progressQuery = query(collection(db, 'estimateProgress'));
    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
      const progressData = {};
      snapshot.docs.forEach(doc => {
        progressData[doc.id] = doc.data();
      });
      setEstimateProgress(progressData);
    });

    // Fetch all clients
    const fetchClients = async () => {
      try {
        const clientsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'client')
        );
        const snapshot = await getDocs(clientsQuery);
        const clientsMap = {};
        snapshot.docs.forEach(doc => {
          clientsMap[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });
        setClients(clientsMap);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    // Fetch all locations
    const fetchLocations = async () => {
      try {
        const locationsQuery = query(collection(db, 'locations'));
        const snapshot = await getDocs(locationsQuery);
        const locationsMap = {};
        snapshot.docs.forEach(doc => {
          locationsMap[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });
        setLocations(locationsMap);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchClients();
    fetchLocations();

    return () => {
      unsubscribeProjects();
      unsubscribeProgress();
    };
  }, [isAdmin, navigation]);

  const getProgressPercentage = (projectId) => {
    const progress = estimateProgress[projectId];
    if (!progress) return 0;

    let total = 0;
    if (progress.descriptionGenerated) total += 20;
    if (progress.descriptionFinalized) total += 20;
    if (progress.calculatorStarted) total += 20;
    if (progress.calculatorComplete) total += 20;
    if (progress.sentToQuickBooks) total += 20;

    return total;
  };

  const getProgressStatus = (projectId) => {
    const progress = estimateProgress[projectId];
    const percentage = getProgressPercentage(projectId);

    if (!progress || percentage === 0) {
      return { label: 'Not Started', color: colors.gray3 };
    } else if (progress.sentToQuickBooks) {
      return { label: 'Sent to QB', color: colors.green };
    } else if (progress.calculatorComplete) {
      return { label: 'Ready to Send', color: colors.blue };
    } else if (progress.descriptionFinalized) {
      return { label: 'Pricing Needed', color: colors.orange };
    } else if (progress.descriptionGenerated) {
      return { label: 'Review Draft', color: colors.purple };
    } else {
      return { label: 'Draft Needed', color: colors.primary };
    }
  };

  const handleProjectPress = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EstimateWorkspace', { projectId: project.id });
  };

  // Get client info for project
  const getClientInfo = (project) => {
    const client = clients[project.clientId];
    if (!client) return { clientName: null, location: null };

    const hasMultipleLocations = client.qbCustomers && client.qbCustomers.length > 1;
    const clientName = client.name || client.company;

    // Only show location if client has multiple locations (using locationId lookup)
    let location = null;
    if (hasMultipleLocations && project.locationId) {
      const locationObj = locations[project.locationId];
      location = locationObj?.name;  // Use FULL name in drafts listing
    }

    return { clientName, location };
  };

  const renderProject = ({ item }) => {
    const progress = getProgressPercentage(item.id);
    const status = getProgressStatus(item.id);
    const { clientName, location } = getClientInfo(item);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.projectCardHeader}>
          <View style={styles.projectCardLeft}>
            <View style={[styles.projectIconContainer, { backgroundColor: `${status.color}15` }]}>
              <Ionicons name="document-text-outline" size={24} color={status.color} />
            </View>
            <View style={styles.projectCardContent}>
              <Text style={styles.projectTitle} numberOfLines={1}>
                {item.title || 'Untitled Project'}
              </Text>
              {clientName && (
                <Text style={styles.projectClient} numberOfLines={1}>
                  {clientName}
                </Text>
              )}
              {location && (
                <Text style={styles.projectLocation} numberOfLines={1}>
                  {location}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray2} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.statusBadge, { color: status.color }]}>
              {status.label}
            </Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: status.color 
                }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drafts & Estimates</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Filter projects that might need estimates (NEW, ESTIMATE_SENT, or any with progress)
  const draftProjects = projects.filter(project => {
    const hasProgress = estimateProgress[project.id];
    const isNotPaid = project.status !== 'PAID' && project.status !== 'COMPLETE';
    return isNotPaid || hasProgress;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drafts & Estimates</Text>
        <View style={{ width: 44 }} />
      </View>

      {draftProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray3} />
          </View>
          <Text style={styles.emptyTitle}>No Drafts</Text>
          <Text style={styles.emptyText}>
            Projects that need estimates will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={draftProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    ...TYPOGRAPHY.title2,
    color: colors.label,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  projectCard: {
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  projectCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectCardContent: {
    flex: 1,
  },
  projectTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
    marginBottom: 2,
  },
  projectClient: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    fontWeight: '600',
  },
  projectLocation: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  progressSection: {
    gap: SPACING.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  progressPercentage: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: colors.secondaryLabel,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.systemFill,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
    textAlign: 'center',
  },
});
