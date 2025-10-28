// ProjectsScreen - List and manage projects
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

export default function ProjectsScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load projects from Firestore
  useEffect(() => {
    if (!userProfile) return;

    let projectQuery;
    
    if (isAdmin()) {
      // Admin sees all projects
      projectQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Client sees only their projects
      projectQuery = query(
        collection(db, 'projects'),
        where('clientId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
    }

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      projectQuery,
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          photoCount: doc.data().photos?.length || 0,
          messageCount: 0, // TODO: Count messages from messages collection
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
  }, [userProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore listener will automatically refresh
  };

  const handleProjectPress = (project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Projects</Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Calendar")}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.label} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.label} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyTitle}>No Projects Yet</Text>
            <Text style={styles.emptyText}>
              {isAdmin() ? 'Start by creating your first project' : 'Projects will appear here when assigned to you'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Projects list
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={handleProjectPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.systemBackground,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
});
