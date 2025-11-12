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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

const { width, height } = Dimensions.get('window');
const PHOTO_SIZE = (width - (SPACING.lg * 3)) / 2;

// Function to get status colors based on theme
const getStatusColors = (colors) => ({
  'NEW': colors.blue,
  'ESTIMATE_SENT': colors.purple,
  'APPROVED': colors.green,
  'IN_PROGRESS': colors.orange,
  'COMPLETE': colors.teal,
  'PAID': colors.green,
});

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
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadProject();
    loadInvoices();
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

  const loadInvoices = async () => {
    try {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('matchedToProject', '==', projectId)
      );
      const snapshot = await getDocs(invoicesQuery);
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
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

  const handleStatusPress = () => {
    if (isAdmin) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowStatusPicker(true);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setProject({ ...project, status: newStatus });
      setShowStatusPicker(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const handleCreateEstimate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('EstimateWorkspace', { projectId: project.id });
  };

  const handleViewMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Conversation', {
      projectId: project.id,
      projectTitle: project.title || 'Project Messages',
      clientId: project.clientId
    });
  };

  const handleViewEstimate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pdfLink = project.invoicePdfLink || project.estimatePdfLink;
    if (pdfLink) {
      await Linking.openURL(pdfLink);
    }
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

  const STATUS_COLORS = getStatusColors(colors);
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
        {(project.invoicePdfLink || project.estimatePdfLink) ? (
          <TouchableOpacity onPress={handleViewEstimate} style={styles.headerIconButton}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Title & Status */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{project.title || 'Untitled Project'}</Text>
            <TouchableOpacity 
              style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
              onPress={handleStatusPress}
              activeOpacity={isAdmin ? 0.7 : 1}
              disabled={!isAdmin}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
              {isAdmin && (
                <Ionicons name="chevron-down" size={14} color={statusColor} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Client Name and Location */}
          {project.clientName && (
            <View style={styles.clientInfoContainer}>
              <View style={styles.clientRow}>
                <Ionicons name="person" size={16} color={colors.secondaryLabel} />
                <Text style={styles.clientText}>{project.clientName}</Text>
              </View>
              {project.locationName && (
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={colors.secondaryLabel} />
                  <Text style={styles.locationText}>{project.locationName}</Text>
                </View>
              )}
              {project.freshbooksInvoiceNumber && (
                <View style={styles.invoiceIdRow}>
                  <Ionicons name="document-outline" size={16} color={colors.secondaryLabel} />
                  <Text style={styles.invoiceIdText}>Invoice {project.freshbooksInvoiceNumber}</Text>
                </View>
              )}
              {project.quickbooksInvoiceNumber && (
                <View style={styles.estimateRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.secondaryLabel} />
                  <Text style={styles.estimateText}>Invoice #{project.quickbooksInvoiceNumber}</Text>
                </View>
              )}
              {project.quickbooksEstimateNumber && (
                <View style={styles.estimateRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.secondaryLabel} />
                  <Text style={styles.estimateText}>Estimate #{project.quickbooksEstimateNumber}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Total Price Card - Prominent Display */}
        {((project.totalAmount != null && project.totalAmount > 0) ||
          (project.estimatedTotal != null && project.estimatedTotal > 0) ||
          (project.totalPrice != null && project.totalPrice > 0)) && (
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
              <Text style={styles.priceLabel}>Project Value</Text>
            </View>
            <Text style={styles.priceValue}>
              ${(project.totalAmount || project.estimatedTotal || project.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          {/* Admin Actions - Create/Edit Estimate */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCreateEstimate}
              activeOpacity={0.7}
            >
              <View style={[styles.actionContent, styles.estimateCard]}>
                <View style={styles.actionIcon}>
                  <Ionicons name="calculator" size={24} color={colors.systemBackground} />
                </View>
                <Text style={styles.actionText} numberOfLines={1}>
                  {project.status === 'NEW' ? 'Estimate' : 'Estimate'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.systemBackground} />
              </View>
            </TouchableOpacity>
          )}

          {/* Messages Button - Both Admin and Client */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleViewMessages}
            activeOpacity={0.7}
          >
            <View style={[styles.actionContent, styles.messagesCard]}>
              <View style={styles.actionIcon}>
                <Ionicons name="chatbubbles" size={24} color={colors.systemBackground} />
              </View>
              <Text style={styles.actionText} numberOfLines={1}>Messages</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.systemBackground} />
            </View>
          </TouchableOpacity>
        </View>

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

        {/* Invoices Section */}
        {invoices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.label} />
              <Text style={styles.sectionTitle}>Invoices ({invoices.length})</Text>
            </View>
            {invoices.map((invoice, index) => {
              const statusColor = invoice.paymentStatus === 'PAID' ? colors.green :
                                  invoice.paymentStatus === 'PARTIAL' ? colors.orange :
                                  colors.red;

              return (
                <TouchableOpacity
                  key={invoice.id}
                  style={[styles.invoiceCard, index > 0 && styles.invoiceCardSpacing]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('InvoiceDetail', { invoice });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceHeaderLeft}>
                      <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                      <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
                    </View>
                    <View style={[styles.invoiceStatusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.invoiceStatusText, { color: statusColor }]}>
                        {invoice.paymentStatus}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.invoiceDetails}>
                    {invoice.txnDate && (
                      <View style={styles.invoiceDetailRow}>
                        <Ionicons name="calendar-outline" size={14} color={colors.secondaryLabel} />
                        <Text style={styles.invoiceDetailText}>
                          {new Date(invoice.txnDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    )}
                    <View style={styles.invoiceFooter}>
                      <Text style={styles.invoiceAmount}>
                        ${invoice.totalAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.tertiaryLabel} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <Pressable style={styles.statusModalOverlay} onPress={() => setShowStatusPicker(false)}>
          <View style={styles.statusModalContainer}>
            <View style={styles.statusModalContent}>
              <View style={styles.statusModalHeader}>
                <Text style={styles.statusModalTitle}>Change Status</Text>
                <TouchableOpacity 
                  onPress={() => setShowStatusPicker(false)}
                  style={styles.statusModalClose}
                >
                  <Ionicons name="close" size={24} color={colors.label} />
                </TouchableOpacity>
              </View>
              
              {Object.keys(STATUS_LABELS).map((statusKey) => {
                const STATUS_COLORS = getStatusColors(colors);
                const color = STATUS_COLORS[statusKey];
                const label = STATUS_LABELS[statusKey];
                const isCurrentStatus = project?.status === statusKey;
                
                return (
                  <TouchableOpacity
                    key={statusKey}
                    style={[
                      styles.statusOption,
                      isCurrentStatus && styles.statusOptionSelected
                    ]}
                    onPress={() => handleStatusChange(statusKey)}
                    disabled={updatingStatus || isCurrentStatus}
                  >
                    <View style={[styles.statusOptionBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.statusOptionText, { color: color }]}>
                        {label}
                      </Text>
                    </View>
                    {isCurrentStatus && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                    {updatingStatus && !isCurrentStatus && (
                      <ActivityIndicator size="small" color={colors.secondaryLabel} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
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
  // Client and Location Info (FreshBooks)
  clientInfoContainer: {
    marginTop: SPACING.md,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  clientText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: colors.secondaryLabel,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '500',
    color: colors.secondaryLabel,
  },
  invoiceIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs / 2,
  },
  invoiceIdText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '500',
    color: colors.secondaryLabel,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs / 2,
  },
  estimateText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '500',
    color: colors.secondaryLabel,
  },
  // Total Price Card
  priceCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    ...TYPOGRAPHY.headline,
    color: colors.secondaryLabel,
    fontWeight: '600',
  },
  priceValue: {
    ...TYPOGRAPHY.largeTitle,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 36,
  },
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    minHeight: 60,
  },
  estimateCard: {
    backgroundColor: colors.primary,
  },
  messagesCard: {
    backgroundColor: colors.green,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '700',
    flex: 1,
    marginLeft: SPACING.sm,
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
  // Invoice Cards
  invoiceCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  invoiceCardSpacing: {
    marginTop: SPACING.sm,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  invoiceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  invoiceNumber: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
  invoiceStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  invoiceStatusText: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '600',
  },
  invoiceDetails: {
    gap: SPACING.xs,
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  invoiceDetailText: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs / 2,
  },
  invoiceAmount: {
    ...TYPOGRAPHY.subheadline,
    color: colors.primary,
    fontWeight: '700',
  },
  // Status Picker Modal
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  statusModalContent: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusModalTitle: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
    fontWeight: '700',
  },
  statusModalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  statusOptionBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    flex: 1,
  },
  statusOptionText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
});
