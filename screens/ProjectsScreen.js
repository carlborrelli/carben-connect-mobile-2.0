// ProjectsScreen - List and manage projects
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'NEW', label: 'New' },
  { key: 'ESTIMATE_SENT', label: 'Estimate Sent' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETE', label: 'Complete' },
  { key: 'PAID', label: 'Paid' },
];

const SORT_OPTIONS = [
  { key: 'DATE_DESC', label: 'Newest First', icon: 'calendar' },
  { key: 'DATE_ASC', label: 'Oldest First', icon: 'calendar-outline' },
  { key: 'CLIENT_NAME', label: 'Client (A-Z)', icon: 'person' },
  { key: 'STATUS', label: 'Status', icon: 'flag' },
];

export default function ProjectsScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [showSortMenu, setShowSortMenu] = useState(false);

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
        setFilteredProjects(projectsData);
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

  // Filter and sort projects when search query, status, or sort changes
  useEffect(() => {
    let filtered = [...projects];

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        const title = (project.title || '').toLowerCase();
        const clientName = (project.clientName || '').toLowerCase();
        const description = (project.description || '').toLowerCase();
        const status = (project.status || '').toLowerCase();

        return title.includes(query) ||
               clientName.includes(query) ||
               description.includes(query) ||
               status.includes(query);
      });
    }

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'DATE_DESC':
          return (b.createdAt?.toDate?.() || new Date(b.createdAt || 0)).getTime() -
                 (a.createdAt?.toDate?.() || new Date(a.createdAt || 0)).getTime();
        case 'DATE_ASC':
          return (a.createdAt?.toDate?.() || new Date(a.createdAt || 0)).getTime() -
                 (b.createdAt?.toDate?.() || new Date(b.createdAt || 0)).getTime();
        case 'CLIENT_NAME':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'STATUS':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  }, [searchQuery, selectedStatus, sortBy, projects]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore listener will automatically refresh
  };

  const handleProjectPress = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  };

  const handleStatusFilter = (status) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStatus(status);
  };

  const handleSortChange = (newSort) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(newSort);
    setShowSortMenu(false);
  };

  const toggleSortMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSortMenu(!showSortMenu);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Projects</Text>
          <TouchableOpacity onPress={toggleSortMenu} style={styles.sortButton}>
            <Ionicons name={showSortMenu ? "funnel" : "funnel-outline"} size={20} color={COLORS.primary} />
            <Text style={styles.sortButtonText}>
              {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label || 'Sort'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Calendar")}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.label} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={styles.sortMenuItem}
              onPress={() => handleSortChange(option.key)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={sortBy === option.key ? COLORS.primary : COLORS.secondaryLabel}
              />
              <Text style={[
                styles.sortMenuItemText,
                sortBy === option.key && styles.sortMenuItemTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.tertiaryLabel} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.tertiaryLabel} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {STATUS_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedStatus === filter.key && styles.filterChipActive
            ]}
            onPress={() => handleStatusFilter(filter.key)}
          >
            <Text style={[
              styles.filterChipText,
              selectedStatus === filter.key && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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

  // No search results
  if (filteredProjects.length === 0 && (searchQuery.length > 0 || selectedStatus !== 'ALL')) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filter
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
        data={filteredProjects}
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
  headerContainer: {
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.label,
    marginBottom: SPACING.xs / 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  sortButtonText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sortMenu: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  sortMenuItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    flex: 1,
  },
  sortMenuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
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
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    height: 44,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    marginRight: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.label,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.systemBackground,
    fontWeight: '600',
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
