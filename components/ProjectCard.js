// ProjectCard - Display project information in a card (WITH CLIENT NAME AND LOCATION)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ProjectCard({ project, onPress, client, isAdmin, selectionMode, isSelected }) {
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
    if (project.estimatePdfLink) {
      await Linking.openURL(project.estimatePdfLink);
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
        location: project.qbCustomerName || null
      };
    }

    // Otherwise, try to get from client lookup
    if (!client) return { clientName: null, location: null };

    const clientName = client.name || client.company;
    const location = project.qbCustomerName || null;

    return { clientName, location };
  };

  const { clientName, location } = getClientInfo();

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

      {/* Client Name - Always show */}
      {clientName && (
        <View style={styles.clientRow}>
          <Ionicons name="person-outline" size={12} color={colors.secondaryLabel} />
          <Text style={styles.clientText} numberOfLines={1}>
            {clientName}
          </Text>
        </View>
      )}

      {/* Location - Always show if available */}
      {location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.secondaryLabel} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={2}>
            {project.title || 'Untitled Project'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Description */}
      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Photo count */}
        {project.photoCount > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="images-outline" size={16} color={colors.secondaryLabel} />
            <Text style={styles.footerText}>{project.photoCount}</Text>
          </View>
        )}

        {/* Message count */}
        {project.messageCount > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="mail-outline" size={16} color={colors.secondaryLabel} />
            <Text style={styles.footerText}>{project.messageCount}</Text>
          </View>
        )}

        {/* Date */}
        {project.createdAt && (
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.secondaryLabel} />
            <Text style={styles.footerText}>
              {project.createdAt?.toDate ?
                project.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) :
                new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
            </Text>
          </View>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Total Price - check both totalPrice and estimatedTotal */}
        {(project.estimatedTotal != null && project.estimatedTotal > 0) || (project.totalPrice != null && project.totalPrice > 0) ? (
          <Text style={styles.priceText}>
            ${(project.estimatedTotal || project.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        ) : null}

        {/* Estimate PDF Link Button */}
        {project.estimatePdfLink && (
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
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs / 2,
  },
  clientText: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '600',
    flex: 1,
    color: colors.secondaryLabel,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs / 2,
  },
  locationText: {
    ...TYPOGRAPHY.caption2,
    fontWeight: '500',
    flex: 1,
    color: colors.secondaryLabel,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
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
