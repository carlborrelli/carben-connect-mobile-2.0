import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - (SPACING.lg * 3)) / 2;

export default function ProjectOverviewTab({ project }) {
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);

  // Fetch full client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!project?.clientId) {
        setLoadingClient(false);
        return;
      }

      try {
        const clientDoc = await getDoc(doc(db, 'users', project.clientId));
        if (clientDoc.exists()) {
          setClientDetails(clientDoc.data());
        }
      } catch (error) {
        console.error('Error fetching client details:', error);
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClientDetails();
  }, [project?.clientId]);

  if (!project) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="information-circle-outline" size={48} color={COLORS.gray3} />
        <Text style={styles.emptyText}>No project information available</Text>
      </View>
    );
  }

  // Determine if client has multiple locations
  const hasMultipleLocations = clientDetails?.qbCustomers && clientDetails.qbCustomers.length > 1;
  const projectLocation = project.qbCustomerName || project.address || project.location;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CUSTOMER</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={22} color={COLORS.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValue}>{clientDetails?.name || 'No client name'}</Text>
              {clientDetails?.email && (
                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color={COLORS.secondaryLabel} />
                  <Text style={styles.contactText}>{clientDetails.email}</Text>
                </View>
              )}
              {clientDetails?.phone && (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color={COLORS.secondaryLabel} />
                  <Text style={styles.contactText}>{clientDetails.phone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Project Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROJECT LOCATION</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={22} color={COLORS.blue} />
            <Text style={styles.infoValue}>
              {projectLocation || 'No location specified'}
            </Text>
          </View>
        </View>
      </View>

      {/* Client Locations (if multiple) */}
      {hasMultipleLocations && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL CLIENT LOCATIONS</Text>
          <View style={styles.locationsContainer}>
            {clientDetails.qbCustomers.map((qbCustomer, index) => {
              const isProjectLocation = qbCustomer.id === project.qbCustomerId ||
                                       qbCustomer.name === project.qbCustomerName ||
                                       qbCustomer.name === projectLocation;

              return (
                <View
                  key={qbCustomer.id || index}
                  style={[
                    styles.locationCard,
                    isProjectLocation && styles.locationCardActive
                  ]}
                >
                  <View style={styles.locationHeader}>
                    <Ionicons
                      name={isProjectLocation ? "location" : "location-outline"}
                      size={18}
                      color={isProjectLocation ? COLORS.primary : COLORS.secondaryLabel}
                    />
                    <Text style={[
                      styles.locationName,
                      isProjectLocation && styles.locationNameActive
                    ]}>
                      {qbCustomer.name}
                    </Text>
                    {isProjectLocation && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Single Client Location (if only one) */}
      {!hasMultipleLocations && clientDetails?.qbCustomers && clientDetails.qbCustomers.length === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CLIENT LOCATION</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={20} color={COLORS.secondaryLabel} />
              <Text style={styles.infoValue}>{clientDetails.qbCustomers[0].name}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Legacy: Show qbLocationName if no qbCustomers array exists */}
      {!hasMultipleLocations && !clientDetails?.qbCustomers && clientDetails?.qbLocationName && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CLIENT LOCATION</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={20} color={COLORS.secondaryLabel} />
              <Text style={styles.infoValue}>{clientDetails.qbLocationName}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Project Description */}
      {project.description && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROJECT DESCRIPTION</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{project.description}</Text>
          </View>
        </View>
      )}

      {/* Photos */}
      {project.photos && project.photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS ({project.photos.length})</Text>
          <View style={styles.photoGrid}>
            {project.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image
                  source={{ uri: photo.url || photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty Photos State */}
      {(!project.photos || project.photos.length === 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS</Text>
          <View style={styles.emptyPhotosCard}>
            <Ionicons name="images-outline" size={48} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyPhotosText}>No photos added yet</Text>
          </View>
        </View>
      )}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs / 2,
  },
  contactText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  locationsContainer: {
    gap: SPACING.sm,
  },
  locationCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  locationCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  locationName: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    fontWeight: '600',
    flex: 1,
  },
  locationNameActive: {
    color: COLORS.primary,
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  currentBadgeText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.systemBackground,
    fontWeight: '700',
    fontSize: 10,
  },
  locationAddress: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    marginLeft: 24,
    lineHeight: 20,
  },
  locationNotes: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginLeft: 24,
    marginTop: SPACING.xs / 2,
    fontStyle: 'italic',
  },
  descriptionCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  descriptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    lineHeight: 22,
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
  emptyPhotosCard: {
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyPhotosText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
});
