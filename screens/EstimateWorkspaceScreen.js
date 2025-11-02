import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

// Tab components
import ProjectOverviewTab from '../components/estimate/ProjectOverviewTab';
import AIEstimateTab from '../components/estimate/AIEstimateTab';
import CalculatorTab from '../components/estimate/CalculatorTab';
import SendToQuickBooksTab from '../components/estimate/SendToQuickBooksTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'information-circle' },
  { id: 'estimate', label: 'Estimate', icon: 'document-text' },
  { id: 'calculator', label: 'Calculator', icon: 'calculator' },
  { id: 'quickbooks', label: 'QuickBooks', icon: 'cloud-upload' },
];

export default function EstimateWorkspaceScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { projectId } = route.params;
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [estimateProgress, setEstimateProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      Alert.alert('Error', 'Project ID is required');
      navigation.goBack();
      return;
    }

    // Real-time listener for project data
    const unsubscribeProject = onSnapshot(
      doc(db, 'projects', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert('Error', 'Project not found');
          navigation.goBack();
        }
      },
      (error) => {
        console.error('Error fetching project:', error);
        Alert.alert('Error', 'Failed to load project');
      }
    );

    // Real-time listener for estimate progress
    const unsubscribeProgress = onSnapshot(
      doc(db, 'estimateProgress', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          setEstimateProgress(docSnap.data());
        } else {
          // Initialize with default progress
          setEstimateProgress({
            descriptionGenerated: false,
            descriptionFinalized: false,
            calculatorStarted: false,
            calculatorComplete: false,
            sentToQuickBooks: false,
            lastEditedBy: null,
            lastEditedAt: null,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching progress:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProject();
      unsubscribeProgress();
    };
  }, [projectId, navigation]);

  const handleTabPress = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  };

  // Admin-only access check
  if (!isAdmin()) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="lock-closed" size={48} color={colors.red} />
          </View>
          <Text style={styles.errorTitle}>Access Restricted</Text>
          <Text style={styles.errorText}>
            Only administrators can access the estimate workspace
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading estimate workspace...</Text>
      </View>
    );
  }

  const getTabStatus = (tabId) => {
    if (!estimateProgress) return 'pending';
    
    switch (tabId) {
      case 'overview':
        return 'complete';
      case 'estimate':
        return estimateProgress.descriptionFinalized ? 'complete' : 'pending';
      case 'calculator':
        return estimateProgress.calculatorComplete ? 'complete' : 'pending';
      case 'quickbooks':
        return estimateProgress.sentToQuickBooks ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProjectOverviewTab project={project} />;
      case 'estimate':
        return (
          <AIEstimateTab
            projectId={projectId}
            project={project}
            estimateProgress={estimateProgress}
          />
        );
      case 'calculator':
        return (
          <CalculatorTab
            projectId={projectId}
            estimateProgress={estimateProgress}
          />
        );
      case 'quickbooks':
        return (
          <SendToQuickBooksTab
            projectId={projectId}
            project={project}
            estimateProgress={estimateProgress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.label} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Estimate</Text>
          <Text style={styles.headerSubtitle}>{project?.clientName || 'Project'}</Text>
        </View>
        
        <View style={{ width: 44 }} />
      </View>

      {/* Tab Navigation Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const status = getTabStatus(tab.id);
          const isComplete = status === 'complete';

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                <Ionicons
                  name={isComplete ? 'checkmark-circle' : tab.icon}
                  size={20}
                  color={isActive ? colors.primary : isComplete ? colors.green : colors.gray3}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
                isComplete && styles.tabLabelComplete
              ]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.systemGroupedBackground,
    padding: SPACING.lg,
  },
  errorCard: {
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    maxWidth: 320,
    ...SHADOWS.medium,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.systemBackground,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
    marginTop: SPACING.md,
  },
  header: {
    backgroundColor: colors.systemBackground,
    paddingTop: 60,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    position: 'relative',
  },
  tabItemActive: {
    // Active state styling handled by indicator
  },
  tabIconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    ...TYPOGRAPHY.caption2,
    color: colors.tertiaryLabel,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabLabelComplete: {
    color: colors.green,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
});
