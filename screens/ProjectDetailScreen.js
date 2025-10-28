// ProjectDetailScreen - View full project details
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');
const PHOTO_SIZE = (width - (SPACING.lg * 3)) / 2;

const STATUS_COLORS = {
  'NEW': COLORS.blue,
  'ESTIMATE_SENT': COLORS.purple,
  'APPROVED': COLORS.green,
  'IN_PROGRESS': COLORS.orange,
  'COMPLETE': COLORS.teal,
  'PAID': COLORS.green,
};

const STATUS_LABELS = {
  'NEW': 'New',
  'ESTIMATE_SENT': 'Estimate Sent',
  'APPROVED': 'Approved',
  'IN_PROGRESS': 'In Progress',
  'COMPLETE': 'Complete',
  'PAID': 'Paid',
};

export default function ProjectDetailScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPress = (photo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhoto(photo);
  };

  const closePhotoViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[project.status] || COLORS.gray;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Title & Status */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{project.title || 'Untitled Project'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        {project.clientName && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={COLORS.secondaryLabel} />
              <Text style={styles.infoLabel}>Client</Text>
            </View>
            <Text style={styles.infoValue}>{project.clientName}</Text>
          </View>
        )}

        {/* Description */}
        {project.description && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.secondaryLabel} />
              <Text style={styles.infoLabel}>Description</Text>
            </View>
            <Text style={styles.infoValue}>{project.description}</Text>
          </View>
        )}

        {/* Photos */}
        {project.photos && project.photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={COLORS.label} />
              <Text style={styles.sectionTitle}>Photos ({project.photos.length})</Text>
            </View>
            <View style={styles.photoGrid}>
              {project.photos.map((photo, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.photoContainer}
                  onPress={() => handlePhotoPress(photo)}
                >
                  <Image
                    source={{ uri: photo.url || photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty Photos State */}
        {(!project.photos || project.photos.length === 0) && (
          <View style={styles.infoCard}>
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={48} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyPhotosText}>No photos yet</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <Pressable style={styles.modalOverlay} onPress={closePhotoViewer}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closePhotoViewer}
            >
              <Ionicons name="close" size={32} color={COLORS.systemBackground} />
            </TouchableOpacity>

            {/* Full Screen Photo */}
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.url || selectedPhoto }}
                style={styles.fullScreenPhoto}
                resizeMode="contain"
              />
            )}
          </SafeAreaView>
        </Pressable>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.title1,
    color: COLORS.label,
    flex: 1,
    marginRight: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    ...TYPOGRAPHY.subheadline,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.label,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.tertiarySystemBackground,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyPhotosText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
  // Photo Viewer Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    zIndex: 10,
  },
  fullScreenPhoto: {
    width: width,
    height: height,
  },
});
