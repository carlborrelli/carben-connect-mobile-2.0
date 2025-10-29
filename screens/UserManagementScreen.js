// UserManagementScreen - Admin user management
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function UserManagementScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, ADMIN, CLIENT

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'This feature is only available to administrators.');
      navigation.goBack();
    }
  }, [isAdmin]);

  // Load users from Firestore
  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading users:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = [...users];

    // Filter by role
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(user =>
        selectedFilter === 'ADMIN' ? user.role === 'admin' : user.role !== 'admin'
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, selectedFilter, users]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  const handleUserPress = (user) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      user.name || 'User',
      `Email: ${user.email}\nRole: ${user.role || 'client'}\nPhone: ${user.phone || 'N/A'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Toggle Role',
          onPress: () => handleToggleRole(user),
        },
        userProfile.id !== user.id && {
          text: 'Delete User',
          style: 'destructive',
          onPress: () => handleDeleteUser(user),
        },
      ].filter(Boolean)
    );
  };

  const handleToggleRole = async (user) => {
    if (user.id === userProfile.id) {
      Alert.alert('Error', 'You cannot change your own role.');
      return;
    }

    try {
      const newRole = user.role === 'admin' ? 'client' : 'admin';
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `User role changed to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to delete user');
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

  const handleFilterChange = (filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filter);
  };

  const renderUserCard = ({ item: user }) => {
    const isCurrentUser = user.id === userProfile?.id;
    const isAdminUser = user.role === 'admin';

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(user)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, isAdminUser && styles.avatarAdmin]}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{user.name || 'Unnamed User'}</Text>
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

          <Text style={styles.userEmail}>{user.email}</Text>

          {user.phone && (
            <View style={styles.userDetail}>
              <Ionicons name="call-outline" size={14} color={COLORS.secondaryLabel} />
              <Text style={styles.userDetailText}>{user.phone}</Text>
            </View>
          )}

          {user.quickbooksCustomerId && (
            <View style={styles.userDetail}>
              <Ionicons name="business-outline" size={14} color={COLORS.secondaryLabel} />
              <Text style={styles.userDetailText}>QB: {user.quickbooksCustomerId}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.tertiaryLabel} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Management</Text>
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
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.tertiaryLabel} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        {['ALL', 'ADMIN', 'CLIENT'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.filterChipTextActive
            ]}>
              {filter === 'ALL' ? 'All Users' : filter === 'ADMIN' ? 'Admins' : 'Clients'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.filter(u => u.role === 'admin').length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.filter(u => u.role !== 'admin').length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
      </View>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={COLORS.tertiaryLabel} />
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'No users match the selected filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
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
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.systemBackground,
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
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
    backgroundColor: COLORS.systemBackground,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
  },
  statNumber: {
    ...TYPOGRAPHY.title2,
    color: COLORS.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    marginTop: SPACING.lg,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarAdmin: {
    backgroundColor: COLORS.orange,
  },
  avatarText: {
    ...TYPOGRAPHY.title3,
    color: COLORS.systemBackground,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  userName: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  userEmail: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.xs / 2,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  userDetailText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  youBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.blue + '20',
    borderRadius: RADIUS.xs,
  },
  youText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.blue,
    fontWeight: '700',
  },
  adminBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.orange + '20',
    borderRadius: RADIUS.xs,
  },
  adminText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.orange,
    fontWeight: '700',
  },
});
