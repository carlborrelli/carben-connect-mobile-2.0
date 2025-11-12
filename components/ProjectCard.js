// ProjectCard - Display project information in a card (WITH CLIENT NAME AND LOCATION)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ProjectCard({ project, onPress, client, location, isAdmin, selectionMode, isSelected }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(project);
  };

  const handleEstimateLinkPress = async (e) => {
    e.stopPropagation(); // Prevent card press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pdfLink = project.invoicePdfLink || project.estimatePdfLink;
    if (pdfLink) {
      await Linking.openURL(pdfLink);
    }
  };

  const statusColor = STATUS_COLORS[project.status] || colors.gray;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  // Get client name and location
  const getClientInfo = () => {
    // If project has clientName field (imported projects), use it directly
    if (project.clientName) {
      return {
        clientName: project.clientName,
        locationName: location?.name || null  // Use FULL name in listing
      };
    }

    // Otherwise, try to get from client lookup
    if (!client) return { clientName: null, locationName: null };

    const clientName = client.name || client.company;
    const locationName = location?.name || null;  // Use FULL name in listing

    return { clientName, locationName };
  };

  const { clientName, locationName } = getClientInfo();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selectionMode && isSelected && styles.cardSelected
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={18} color={colors.systemBackground} />
            )}
          </View>
        </View>
      )}

      {/* Client Name - Prominent display */}
      {clientName && (
        <Text style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>
      )}

      {/* Location - Same size as client with icon */}
      {locationName && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.secondaryLabel} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      )}

      {/* FreshBooks Invoice ID */}
      {project.freshbooksInvoiceNumber && (
        <View style={styles.invoiceIdRow}>
          <Ionicons name="document-outline" size={14} color={colors.secondaryLabel} />
          <Text style={styles.invoiceIdText} numberOfLines={1}>
            Invoice {project.freshbooksInvoiceNumber}
          </Text>
        </View>
      )}

      {/* QuickBooks Invoice ID */}
      {project.quickbooksInvoiceNumber && (
        <View style={styles.invoiceIdRow}>
          <Ionicons name="document-outline" size={14} color={colors.secondaryLabel} />
          <Text style={styles.invoiceIdText} numberOfLines={1}>
            Invoice {project.quickbooksInvoiceNumber}
          </Text>
        </View>
      )}

      {/* Title - Larger, from AI-generated description */}
      <Text style={styles.title} numberOfLines={2}>
        {project.title || 'Untitled Project'}
      </Text>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel}
        </Text>
      </View>

      {/* Description */}
      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Date - prioritize txnDate for invoices */}
        {(project.txnDate || project.createdAt) && (
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.secondaryLabel} />
            <Text style={styles.footerText}>
              {project.txnDate ?
                new Date(project.txnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) :
                (project.createdAt?.toDate ?
                  project.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) :
                  new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                )
              }
            </Text>
          </View>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Total Amount - check totalAmount, estimatedTotal, or totalPrice */}
        {(project.totalAmount != null && project.totalAmount > 0) ||
         (project.estimatedTotal != null && project.estimatedTotal > 0) ||
         (project.totalPrice != null && project.totalPrice > 0) ? (
          <Text style={styles.priceText}>
            ${(project.totalAmount || project.estimatedTotal || project.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        ) : null}

        {/* Invoice PDF Link Button - check both invoicePdfLink and estimatePdfLink */}
        {(project.invoicePdfLink || project.estimatePdfLink) && (
          <TouchableOpacity onPress={handleEstimateLinkPress} style={styles.estimateLinkButton}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: colors.secondarySystemGroupedBackground,
    ...SHADOWS.small,
  },
  cardSelected: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkboxContainer: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.separator,
    backgroundColor: colors.systemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  clientName: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '600',
    color: colors.label,
    marginBottom: SPACING.xs / 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs / 2,
  },
  locationText: {
    ...TYPOGRAPHY.subheadline,
    fontWeight: '500',
    flex: 1,
    color: colors.secondaryLabel,
  },
  invoiceIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  invoiceIdText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '500',
    flex: 1,
    color: colors.tertiaryLabel,
  },
  title: {
    ...TYPOGRAPHY.title3,
    fontWeight: '600',
    color: colors.label,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
  },
  description: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.sm,
    color: colors.secondaryLabel,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  footerText: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
  },
  priceText: {
    ...TYPOGRAPHY.headline,
    color: colors.primary,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  estimateLinkButton: {
    marginRight: SPACING.sm,
  },
});
