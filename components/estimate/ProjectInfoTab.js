import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';

export default function ProjectInfoTab({ project }) {
  if (!project) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="information-circle-outline" size={48} color={COLORS.gray3} />
        <Text style={styles.emptyText}>No project information available</Text>
      </View>
    );
  }

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <InfoRow
        icon="business-outline"
        label="Client Name"
        value={project.clientName}
      />
      <InfoRow
        icon="location-outline"
        label="Address"
        value={project.address}
      />
      <InfoRow
        icon="document-text-outline"
        label="Project Title"
        value={project.title}
      />
      {project.description && (
        <InfoRow
          icon="list-outline"
          label="Description"
          value={project.description}
        />
      )}
      <InfoRow
        icon="flag-outline"
        label="Status"
        value={project.status}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
  },
});
