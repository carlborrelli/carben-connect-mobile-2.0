// ProjectDetailScreen - View full project details
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
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
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

const { width, height } = Dimensions.get('window');
const PHOTO_SIZE = (width - (SPACING.lg * 3)) / 2;

const STATUS_COLORS = {
  'NEW': colors.blue,
  'ESTIMATE_SENT': colors.purple,
  'APPROVED': colors.green,
  'IN_PROGRESS': colors.orange,
  'COMPLETE': colors.teal,
  'PAID': colors.green,
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { projectId } = route.params;
  const { userProfile } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const isAdmin = userProfile?.role === 'admin';

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

  const handleCreateEstimate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('EstimateWorkspace', { projectId: project.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
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

  const statusColor = STATUS_COLORS[project.status] || colors.gray;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        {/* Add Estimate Button in Header for Admins */}
        {isAdmin && (
          <TouchableOpacity 
            onPress={handleCreateEstimate}
            style={styles.headerEstimateButton}
          >
            <Ionicons name="calculator" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        {!isAdmin && <View style={{ width: 44 }} />}
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

        {/* Admin Actions - Create/Edit Estimate - MORE PROMINENT */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.estimateCard}
            onPress={handleCreateEstimate}
            activeOpacity={0.7}
          >
            <View style={styles.estimateCardLeft}>
              <View style={styles.estimateIconContainer}>
                <Ionicons name="calculator" size={32} color={colors.systemBackground} />
              </View>
              <View style={styles.estimateCardContent}>
                <Text style={styles.estimateCardTitle}>
                  {project.status === 'NEW' ? 'Create Estimate' : 'View/Edit Estimate'}
                </Text>
                <Text style={styles.estimateCardSubtitle}>
                  Draft description, calculate pricing, and send to QuickBooks
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Client Info */}
        {project.clientName && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.secondaryLabel} />
              <Text style={styles.infoLabel}>Client</Text>
            </View>
            <Text style={styles.infoValue}>{project.clientName}</Text>
          </View>
        )}

        {/* Description */}
        {project.description && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color={colors.secondaryLabel} />
              <Text style={styles.infoLabel}>Description</Text>
            </View>
            <Text style={styles.infoValue}>{project.description}</Text>
          </View>
        )}

        {/* Photos */}
        {project.photos && project.photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={colors.label} />
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
              <Ionicons name="images-outline" size={48} color={colors.tertiaryLabel} />
              <Text style={styles.emptyPhotosText}>No photos yet</Text>
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
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
              <Ionicons name="close" size={32} color={colors.systemBackground} />
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
    flex: 1,
    textAlign: 'center',
  },
  headerEstimateButton: {
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
  errorText: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
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
    color: colors.label,
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
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  estimateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  estimateIconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estimateCardContent: {
    flex: 1,
  },
  estimateCardTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.systemBackground,
    fontWeight: '700',
    marginBottom: 4,
  },
  estimateCardSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
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
    color: colors.secondaryLabel,
    fontWeight: '600',
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
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
    backgroundColor: colors.tertiarySystemBackground,
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
    color: colors.tertiaryLabel,
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
