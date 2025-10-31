// ProjectCard - Display project information in a card (WITH CLIENT NAME AND LOCATION)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ProjectCard({ project, onPress, client, isAdmin }) {
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

  const statusColor = STATUS_COLORS[project.status] || colors.gray;
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
          <Ionicons name="person-outline" size={12} color={colors.secondaryLabel} />
          <Text style={styles.clientText} numberOfLines={1}>
            {clientName}
          </Text>
        </View>
      )}

      {/* Location - Only if multiple locations */}
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

        {/* Spacer */}
        <View style={{ flex: 1 }} />

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
});
