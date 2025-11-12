// ProjectsScreen - List and manage projects
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
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
import { collection, query, orderBy, onSnapshot, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';
import { Alert } from 'react-native';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [clients, setClients] = useState({});
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); // Selected client for filtering
  const [selectedLocation, setSelectedLocation] = useState(null); // Selected location for filtering
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [expandedClient, setExpandedClient] = useState(null); // Track which client is expanded in dropdown
  const [selectionMode, setSelectionMode] = useState(false); // Multi-select mode
  const [selectedProjects, setSelectedProjects] = useState([]); // Selected project IDs

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

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsQuery = query(collection(db, 'clients'));
        const snapshot = await getDocs(clientsQuery);
        const clientsMap = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          clientsMap[doc.id] = {
            id: doc.id,
            ...data,
            // Format client name for display
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.company || 'Unnamed Client'
          };
        });
        setClients(clientsMap);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsQuery = query(collection(db, 'locations'));
        const snapshot = await getDocs(locationsQuery);
        const locationsMap = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          locationsMap[doc.id] = {
            id: doc.id,
            ...data
          };
        });
        setLocations(locationsMap);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Filter and sort projects when filters change
  useEffect(() => {
    let filtered = [...projects];

    // Filter by client (using clientId, not clientName)
    if (selectedClient) {
      filtered = filtered.filter(project => project.clientId === selectedClient);
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(project => project.locationName === selectedLocation);
    }

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        const title = (project.title || '').toLowerCase();
        // Look up client name from clients object using clientId
        const clientName = (clients[project.clientId]?.name || '').toLowerCase();
        const location = (project.locationName || '').toLowerCase();
        const description = (project.description || '').toLowerCase();
        const status = (project.status || '').toLowerCase();

        return title.includes(query) ||
               clientName.includes(query) ||
               location.includes(query) ||
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
          // Look up client names for sorting
          const aClientName = clients[a.clientId]?.name || '';
          const bClientName = clients[b.clientId]?.name || '';
          return aClientName.localeCompare(bClientName);
        case 'STATUS':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  }, [searchQuery, selectedStatus, sortBy, selectedClient, selectedLocation, projects, clients]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore listener will automatically refresh
  };

  const handleProjectPress = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectionMode) {
      // Toggle selection
      if (selectedProjects.includes(project.id)) {
        setSelectedProjects(selectedProjects.filter(id => id !== project.id));
      } else {
        setSelectedProjects([...selectedProjects, project.id]);
      }
    } else {
      navigation.navigate('ProjectDetail', { projectId: project.id });
    }
  };

  const toggleSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(!selectionMode);
    setSelectedProjects([]);
  };

  const handleDeleteProjects = () => {
    if (selectedProjects.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Projects',
      `Are you sure you want to delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              // Delete all selected projects
              await Promise.all(
                selectedProjects.map(projectId =>
                  deleteDoc(doc(db, 'projects', projectId))
                )
              );

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedProjects([]);
              setSelectionMode(false);
            } catch (error) {
              console.error('Error deleting projects:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete projects. Please try again.');
            }
          },
        },
      ]
    );
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
          {selectionMode ? (
            <View>
              <Text style={styles.title}>Select Projects</Text>
              <Text style={[styles.sortButtonText, { color: colors.secondaryLabel }]}>
                {selectedProjects.length} selected
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.title}>Projects</Text>
              <TouchableOpacity onPress={toggleSortMenu} style={styles.sortButton}>
                <Ionicons name={showSortMenu ? "funnel" : "funnel-outline"} size={20} color={colors.primary} />
                <Text style={styles.sortButtonText}>
                  {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label || 'Sort'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.headerIcons}>
          {selectionMode ? (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleDeleteProjects}
                disabled={selectedProjects.length === 0}
              >
                <Ionicons
                  name="trash"
                  size={24}
                  color={selectedProjects.length > 0 ? colors.red : colors.tertiaryLabel}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={toggleSelectionMode}>
                <Ionicons name="close" size={24} color={colors.label} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isAdmin() && (
                <TouchableOpacity style={styles.iconButton} onPress={toggleSelectionMode}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={colors.label} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Calendar")}>
                <Ionicons name="calendar-outline" size={24} color={colors.label} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Profile")}>
                <Ionicons name="person-circle-outline" size={24} color={colors.label} />
              </TouchableOpacity>
            </>
          )}
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
                color={sortBy === option.key ? colors.primary : colors.secondaryLabel}
              />
              <Text style={[
                styles.sortMenuItemText,
                sortBy === option.key && styles.sortMenuItemTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.tertiaryLabel} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={colors.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          )}
        </View>
        {/* Client Filter Dropdown */}
        <TouchableOpacity
          style={[styles.filterDropdownButton, selectedClient && styles.filterDropdownButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowClientMenu(!showClientMenu);
          }}
        >
          <Text style={[styles.filterDropdownText, (selectedClient || selectedLocation) && styles.filterDropdownTextActive]}>
            {selectedLocation || (selectedClient ? (clients[selectedClient]?.name || 'Client') : 'Client')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={selectedClient ? colors.systemBackground : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Client Menu with expandable locations */}
      {showClientMenu && (
        <View style={styles.filterMenu}>
          <TouchableOpacity
            style={styles.filterMenuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedClient(null);
              setSelectedLocation(null);
              setExpandedClient(null);
              setShowClientMenu(false);
            }}
          >
            <Text style={[styles.filterMenuItemText, !selectedClient && !selectedLocation && styles.filterMenuItemTextActive]}>
              All Clients
            </Text>
            {!selectedClient && !selectedLocation && <Ionicons name="checkmark" size={20} color={colors.primary} />}
          </TouchableOpacity>
          {/* Build list of unique clientIds from projects, then display client names */}
          {Array.from(new Set(projects.map(p => p.clientId).filter(Boolean)))
            .sort((a, b) => (clients[a]?.name || '').localeCompare(clients[b]?.name || ''))
            .map(clientId => {
              // Get locations for this client from the locations collection
              const clientLocations = Object.values(locations)
                .filter(loc => loc.clientId === clientId)
                .map(loc => loc.name)
                .sort();
              const isExpanded = expandedClient === clientId;

              return (
                <View key={clientId}>
                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (clientLocations.length === 0) {
                        // No locations - select client immediately
                        setSelectedClient(clientId);
                        setSelectedLocation(null);
                        setExpandedClient(null);
                        setShowClientMenu(false);
                      } else if (isExpanded) {
                        // Already expanded - select client and close
                        setSelectedClient(clientId);
                        setSelectedLocation(null);
                        setExpandedClient(null);
                        setShowClientMenu(false);
                      } else {
                        // Has locations and not expanded - expand to show them
                        setExpandedClient(clientId);
                      }
                    }}
                  >
                    <Text style={[
                      styles.filterMenuItemText,
                      selectedClient === clientId && !selectedLocation && styles.filterMenuItemTextActive
                    ]}>
                      {clients[clientId]?.name || 'Unknown Client'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {selectedClient === clientId && !selectedLocation && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                      {clientLocations.length > 0 && (
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={colors.secondaryLabel}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Show locations when expanded */}
                  {isExpanded && clientLocations.map(location => (
                    <TouchableOpacity
                      key={location}
                      style={[styles.filterMenuItem, { paddingLeft: 32 }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedClient(clientId);
                        setSelectedLocation(location);
                        setExpandedClient(null);
                        setShowClientMenu(false);
                      }}
                    >
                      <Text style={[
                        styles.filterMenuItemText,
                        selectedLocation === location && styles.filterMenuItemTextActive
                      ]}>
                        {location}
                      </Text>
                      {selectedLocation === location && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
        </View>
      )}

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
          <ActivityIndicator size="large" color={colors.primary} />
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
            <Ionicons name="folder-outline" size={64} color={colors.tertiaryLabel} />
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
            <Ionicons name="search-outline" size={64} color={colors.tertiaryLabel} />
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
          <ProjectCard
            project={item}
            onPress={handleProjectPress}
            client={clients[item.clientId]}
            isAdmin={isAdmin()}
            selectionMode={selectionMode}
            isSelected={selectedProjects.includes(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  headerContainer: {
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
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
    color: colors.label,
    marginBottom: SPACING.xs / 2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  sortButtonText: {
    ...TYPOGRAPHY.footnote,
    color: colors.primary,
    fontWeight: '600',
  },
  sortMenu: {
    backgroundColor: colors.secondarySystemGroupedBackground,
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
    borderBottomColor: colors.separator,
  },
  sortMenuItemText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    flex: 1,
  },
  sortMenuItemTextActive: {
    color: colors.primary,
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
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondarySystemGroupedBackground,
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
    color: colors.label,
    height: 44,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
    minWidth: 80,
    justifyContent: 'center',
  },
  filterDropdownButtonActive: {
    backgroundColor: colors.primary,
  },
  filterDropdownText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.primary,
    fontWeight: '600',
  },
  filterDropdownTextActive: {
    color: colors.systemBackground,
  },
  locationFilterContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  filterMenu: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
    maxHeight: 300,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  filterMenuItemText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  filterMenuItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginRight: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.systemBackground,
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
    color: colors.label,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
});
