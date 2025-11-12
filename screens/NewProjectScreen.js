// NewProjectScreen - Create a new project (FIXED to match website data structure)
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';
import VoiceRecorder from '../components/VoiceRecorder';

export default function NewProjectScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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

  const handleVoiceTranscription = (data) => {
    // Update title and description from voice
    if (data.title && !title) {
      setTitle(data.title);
    }
    if (data.description) {
      setDescription(data.description);
    }

    // Store the raw transcription for the inbox
    if (data.transcription) {
      setVoiceTranscription(data.transcription);
    }

    // Close voice recorder
    setShowVoiceRecorder(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable camera access to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0]]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickPhotos = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, ...result.assets]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const removePhoto = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const uploadPhotosToStorage = async (projectId) => {
    const uploadedUrls = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoRef = ref(storage, `projects/${projectId}/photo_${Date.now()}_${i}.jpg`);

      const response = await fetch(photo.uri);
      const blob = await response.blob();

      await uploadBytes(photoRef, blob);

      const downloadURL = await getDownloadURL(photoRef);
      uploadedUrls.push(downloadURL);
    }

    return uploadedUrls;
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

      // Upload photos if any
      if (photos.length > 0) {
        setUploadingPhotos(true);
        const photoUrls = await uploadPhotosToStorage(docRef.id);

        // Update project with photo URLs
        await updateDoc(doc(db, 'projects', docRef.id), {
          photos: photoUrls,
          updatedAt: new Date(),
        });
      }

      // Add voice transcription to inbox if available (admin-only)
      if (voiceTranscription) {
        await addDoc(collection(db, 'messages'), {
          projectId: docRef.id,
          projectTitle: title.trim(),
          senderId: 'SYSTEM',
          senderName: 'Voice Transcription',
          senderRole: 'system',
          message: `Raw transcription: "${voiceTranscription}"`,
          text: `Raw transcription: "${voiceTranscription}"`,
          createdAt: new Date(),
          read: false,
          unread: true,
        });
      }

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
      setUploadingPhotos(false);
    }
  };

  if (loadingClients) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Project</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
      {/* Header - WITHOUT Create button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.systemGroupedBackground }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
                <Ionicons name="chevron-down" size={20} color={colors.secondaryLabel} />
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
                <Ionicons name="chevron-down" size={20} color={colors.secondaryLabel} />
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
                          <Ionicons name="location" size={18} color={colors.primary} />
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
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.infoText}>{selectedClient.qbCustomers[0].name}</Text>
              </View>
            </View>
          )}

          {/* Voice Recording Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Project Details (Use Voice)</Text>
            <View style={styles.voiceRecorderContainer}>
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                existingDescription={description}
                compact={true}
              />
            </View>
          </View>

          {/* Project Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Project Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kitchen Remodel"
              placeholderTextColor={colors.tertiaryLabel}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          {/* Description - BIGGER */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter project details..."
              placeholderTextColor={colors.tertiaryLabel}
              value={description}
              onChangeText={setDescription}
              editable={!loading}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
            />
          </View>

          {/* Photos Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Photos</Text>

            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePhoto}
                disabled={loading || uploadingPhotos}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickPhotos}
                disabled={loading || uploadingPhotos}
              >
                <Ionicons name="images" size={24} color={colors.primary} />
                <Text style={styles.photoButtonText}>Choose Photos</Text>
              </TouchableOpacity>
            </View>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => removePhoto(index)}
                      disabled={loading || uploadingPhotos}
                    >
                      <Ionicons name="close-circle" size={28} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
            <Text style={styles.infoCardText}>
              Use voice to quickly describe your project, or type manually. Add photos now or after creation.
            </Text>
          </View>

          {/* CREATE BUTTON - MOVED TO BOTTOM */}
          <TouchableOpacity
            onPress={handleCreate}
            style={styles.bottomCreateButton}
            disabled={loading || uploadingPhotos}
          >
            {loading || uploadingPhotos ? (
              <ActivityIndicator size="small" color={colors.systemBackground} />
            ) : (
              <Text style={styles.bottomCreateButtonText}>Create Project</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: colors.label,
    minHeight: 44,
  },
  textArea: {
    minHeight: 240,
    paddingTop: SPACING.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  selectButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.tertiaryLabel,
  },
  selectButtonTextFilled: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  picker: {
    backgroundColor: colors.secondarySystemGroupedBackground,
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
    borderBottomColor: colors.separator,
  },
  pickerItemText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  pickerItemSubtext: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  pickerItemNote: {
    ...TYPOGRAPHY.caption2,
    color: colors.primary,
    marginTop: SPACING.xs / 2,
  },
  locationPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.blue + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    flex: 1,
  },
  infoCardText: {
    ...TYPOGRAPHY.footnote,
    color: colors.blue,
    flex: 1,
  },
  voiceRecorderContainer: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  photoButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.primary,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.systemBackground,
    borderRadius: 14,
  },
  // NEW BOTTOM CREATE BUTTON STYLES
  bottomCreateButton: {
    backgroundColor: colors.blue,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
    shadowColor: colors.blue,
  },
  bottomCreateButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.systemBackground,
    fontWeight: '700',
  },
});
