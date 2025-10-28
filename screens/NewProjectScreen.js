// NewProjectScreen - Create a new project
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
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  // Load clients for admin
  useEffect(() => {
    if (!isAdmin()) {
      setLoadingClients(false);
      return;
    }

    const loadClients = async () => {
      try {
        const clientsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'client')
        );
        const snapshot = await getDocs(clientsQuery);
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const handleSelectClient = (client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setClientId(client.id);
    setClientName(client.name);
    setShowClientPicker(false);
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [],
      };

      if (isAdmin()) {
        projectData.clientId = clientId;
        projectData.clientName = clientName;
        projectData.createdBy = userProfile.id;
      } else {
        projectData.clientId = userProfile.id;
        projectData.clientName = userProfile.name;
      }

      await addDoc(collection(db, 'projects'), projectData);

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
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
          <Text style={styles.infoText}>
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
    ...SHADOWS.small,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.blue + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.blue,
    flex: 1,
  },
});
