// InboxScreen - Messages and notifications
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
import MessageCard from '../components/MessageCard';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

export default function InboxScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load messages from Firestore
  useEffect(() => {
    if (!userProfile) return;

    let messageQuery;
    
    if (isAdmin()) {
      // Admin sees all messages
      messageQuery = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Client sees only their messages
      messageQuery = query(
        collection(db, 'messages'),
        where('clientId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
    }

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      messageQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading messages:', error);
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

  const handleMessagePress = (message) => {
    // TODO: Navigate to conversation view
    console.log('Pressed message:', message.id);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Inbox</Text>
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
  if (messages.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>
              Project messages will appear here
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Messages list
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageCard message={item} onPress={handleMessagePress} />
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
