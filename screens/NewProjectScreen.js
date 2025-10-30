// NewProjectScreen - Create a new project (FIXED to match website data structure)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function NewProjectScreen({ navigation }) {
  const { userProfile, isAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clients, setClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedQbCustomerId, setSelectedQbCustomerId] = useState('');
  const [selectedQbCustomerName, setSelectedQbCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  // Load clients and admins
  useEffect(() => {
    const loadUsersAndClients = async () => {
      try {
        // Load all users
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllUsers(usersData);

        // Filter clients
        const clientsData = usersData.filter(u => u.role === 'client');
        setClients(clientsData);

        // Auto-select current user if client
        if (!isAdmin()) {
          setClientId(userProfile.id);
          setClientName(userProfile.name);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadUsersAndClients();
  }, [userProfile, isAdmin]);

  const handleSelectClient = (client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setClientId(client.id);
    setClientName(client.name);
    setShowClientPicker(false);

    // Reset location selection when client changes
    setSelectedQbCustomerId('');
    setSelectedQbCustomerName('');

    // If client has only one location, auto-select it
    if (client.qbCustomers && client.qbCustomers.length === 1) {
      setSelectedQbCustomerId(client.qbCustomers[0].id);
      setSelectedQbCustomerName(client.qbCustomers[0].name);
    }
  };

  const handleSelectLocation = (qbCustomer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQbCustomerId(qbCustomer.id);
    setSelectedQbCustomerName(qbCustomer.name);
    setShowLocationPicker(false);
  };

  const handleCreate = async () => {
    // Validation
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter a project title');
      return;
    }

    if (isAdmin() && !clientId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please select a client');
      return;
    }

    // Check if location is required (client has multiple locations)
    const selectedClient = clients.find(c => c.id === clientId) ||
                          allUsers.find(u => u.id === clientId);
    const hasMultipleLocations = selectedClient?.qbCustomers &&
                                 selectedClient.qbCustomers.length > 1;

    if (hasMultipleLocations && !selectedQbCustomerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please select a location for this client');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Get all admin users for contractorIds (CRITICAL - this is why projects don't show on website!)
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      const contractorIds = adminUsers.map(u => u.id);

      const projectData = {
        title: title.trim(),
        description: description.trim(),
        status: 'NEW',
        clientId: clientId,
        contractorIds: contractorIds, // REQUIRED for website
        photos: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add QB customer info if selected or auto-selected
      if (selectedQbCustomerId) {
        projectData.qbCustomerId = selectedQbCustomerId;
      }
      if (selectedQbCustomerName) {
        projectData.qbCustomerName = selectedQbCustomerName;
      }

      const docRef = await addDoc(collection(db, 'projects'), projectData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Project created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating project:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingClients) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={COLORS.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Project</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const selectedClient = clients.find(c => c.id === clientId) ||
                        allUsers.find(u => u.id === clientId);
  const hasMultipleLocations = selectedClient?.qbCustomers &&
                               selectedClient.qbCustomers.length > 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={COLORS.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
        <TouchableOpacity
          onPress={handleCreate}
          style={styles.createButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Client Selection (Admin only) */}
        {isAdmin() && (
          <View style={styles.section}>
            <Text style={styles.label}>Client *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowClientPicker(!showClientPicker)}
            >
              <Text style={clientName ? styles.selectButtonTextFilled : styles.selectButtonText}>
                {clientName || 'Select a client'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.secondaryLabel} />
            </TouchableOpacity>

            {showClientPicker && (
              <View style={styles.picker}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {clients.map(client => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.pickerItem}
                      onPress={() => handleSelectClient(client)}
                    >
                      <Text style={styles.pickerItemText}>{client.name}</Text>
                      {client.email && (
                        <Text style={styles.pickerItemSubtext}>{client.email}</Text>
                      )}
                      {client.qbCustomers && client.qbCustomers.length > 1 && (
                        <Text style={styles.pickerItemNote}>
                          {client.qbCustomers.length} locations
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Location Selection (if client has multiple locations) */}
        {hasMultipleLocations && (
          <View style={styles.section}>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowLocationPicker(!showLocationPicker)}
            >
              <Text style={selectedQbCustomerName ? styles.selectButtonTextFilled : styles.selectButtonText}>
                {selectedQbCustomerName || 'Select a location'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.secondaryLabel} />
            </TouchableOpacity>

            {showLocationPicker && (
              <View style={styles.picker}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {selectedClient?.qbCustomers?.map(qbCustomer => (
                    <TouchableOpacity
                      key={qbCustomer.id}
                      style={styles.pickerItem}
                      onPress={() => handleSelectLocation(qbCustomer)}
                    >
                      <View style={styles.locationPickerItem}>
                        <Ionicons name="location" size={18} color={COLORS.primary} />
                        <Text style={styles.pickerItemText}>{qbCustomer.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Show single location info (non-editable) */}
        {selectedClient?.qbCustomers && selectedClient.qbCustomers.length === 1 && (
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.infoCard}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>{selectedClient.qbCustomers[0].name}</Text>
            </View>
          </View>
        )}

        {/* Project Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Project Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kitchen Remodel"
            placeholderTextColor={COLORS.tertiaryLabel}
            value={title}
            onChangeText={setTitle}
            editable={!loading}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter project details..."
            placeholderTextColor={COLORS.tertiaryLabel}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.blue} />
          <Text style={styles.infoCardText}>
            The project will be created with status "New". You can add photos and details after creation.
          </Text>
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
  createButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.label,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.label,
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  selectButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
  },
  selectButtonTextFilled: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  picker: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    maxHeight: 200,
    ...SHADOWS.small,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  pickerItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  pickerItemSubtext: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  pickerItemNote: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.primary,
    marginTop: SPACING.xs / 2,
  },
  locationPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.blue + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    flex: 1,
  },
  infoCardText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.blue,
    flex: 1,
  },
});
