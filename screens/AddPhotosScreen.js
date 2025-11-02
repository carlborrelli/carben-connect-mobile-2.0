// AddPhotosScreen - Add photos to a project
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function AddPhotosScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        let projectsQuery;

        if (isAdmin()) {
          // Admin sees all projects
          projectsQuery = query(collection(db, 'projects'));
        } else {
          // Client sees only their projects
          projectsQuery = query(
            collection(db, 'projects'),
            where('clientId', '==', userProfile.id)
          );
        }

        const snapshot = await getDocs(projectsQuery);
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const handleSelectProject = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProject(project);
    setShowProjectPicker(false);
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your camera to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Add to existing selected images
        setSelectedImages(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (!selectedProject) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please select a project');
      return;
    }

    if (selectedImages.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please select at least one photo');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUploading(true);

    try {
      const uploadPromises = selectedImages.map(async (image, index) => {
        // Create unique filename
        const timestamp = Date.now();
        const filename = `projects/${selectedProject.id}/${timestamp}_${index}.jpg`;

        // Fetch the image as a blob
        const response = await fetch(image.uri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        return {
          url: downloadURL,
          uploadedAt: new Date(),
          uploadedBy: userProfile.id,
          uploadedByName: userProfile.name,
        };
      });

      const photoObjects = await Promise.all(uploadPromises);

      // Update project document with new photos
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        photos: arrayUnion(...photoObjects),
        updatedAt: new Date(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success',
        `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} uploaded successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error uploading photos:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loadingProjects) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Photos</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Photos</Text>
        <TouchableOpacity
          onPress={uploadPhotos}
          style={styles.uploadButton}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.uploadButtonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Project Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Project *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowProjectPicker(!showProjectPicker)}
          >
            <Text style={selectedProject ? styles.selectButtonTextFilled : styles.selectButtonText}>
              {selectedProject?.title || 'Select a project'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.secondaryLabel} />
          </TouchableOpacity>

          {showProjectPicker && (
            <View style={styles.picker}>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.pickerItem}
                  onPress={() => handleSelectProject(project)}
                >
                  <Text style={styles.pickerItemText}>{project.title}</Text>
                  {project.clientName && (
                    <Text style={styles.pickerItemSubtext}>{project.clientName}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Photo Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Photos</Text>
          <TouchableOpacity
            style={styles.pickButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
            <Text style={styles.pickButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickButton, { marginTop: SPACING.sm }]}
            onPress={pickImages}
            disabled={uploading}
          >
            <Ionicons name="images" size={24} color={colors.primary} />
            <Text style={styles.pickButtonText}>Select Photos</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Selected ({selectedImages.length})</Text>
            <View style={styles.imageGrid}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                    disabled={uploading}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.systemBackground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
          <Text style={styles.infoText}>
            You can select up to 10 photos at once. Photos will be added to the selected project.
          </Text>
        </View>
      </ScrollView>
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
  uploadButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  uploadButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.primary,
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
    color: colors.label,
    fontWeight: '600',
    marginBottom: SPACING.xs,
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
    ...SHADOWS.small,
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
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  pickButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.primary,
    fontWeight: '600',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
    backgroundColor: colors.tertiarySystemBackground,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.blue + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.footnote,
    color: colors.blue,
    flex: 1,
  },
});
