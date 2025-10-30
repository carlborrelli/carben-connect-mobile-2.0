// ProjectCard - Display project information in a card (WITH CLIENT NAME AND LOCATION)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

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

export default function ProjectCard({ project, onPress, client, isAdmin }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(project);
  };

  const statusColor = STATUS_COLORS[project.status] || COLORS.gray;
  const statusLabel = STATUS_LABELS[project.status] || project.status;

  // Get client name and location
  const getClientInfo = () => {
    if (!client) return { clientName: null, location: null };

    const hasMultipleLocations = client.qbCustomers && client.qbCustomers.length > 1;
    const clientName = client.name || client.company;

    // Only show location if client has multiple locations
    let location = null;
    if (hasMultipleLocations) {
      location = project.qbCustomerName;
    }

    return { clientName, location };
  };

  const { clientName, location } = getClientInfo();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Client Name - Always show */}
      {clientName && (
        <View style={styles.clientRow}>
          <Ionicons name="person-outline" size={12} color={COLORS.secondaryLabel} />
          <Text style={styles.clientText} numberOfLines={1}>
            {clientName}
          </Text>
        </View>
      )}

      {/* Location - Only if multiple locations */}
      {location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.secondaryLabel} />
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
            <Ionicons name="images-outline" size={16} color={COLORS.secondaryLabel} />
            <Text style={styles.footerText}>{project.photoCount}</Text>
          </View>
        )}

        {/* Message count */}
        {project.messageCount > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="mail-outline" size={16} color={COLORS.secondaryLabel} />
            <Text style={styles.footerText}>{project.messageCount}</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={COLORS.tertiaryLabel} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs / 2,
  },
  clientText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs / 2,
  },
  locationText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.secondaryLabel,
    fontWeight: '500',
    flex: 1,
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
    color: COLORS.label,
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
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
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
    color: COLORS.secondaryLabel,
  },
});
