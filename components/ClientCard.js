// ClientCard - Display client information in a card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ClientCard({ client, onPress }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(client);
  };

  // Determine location display
  const hasMultipleLocations = client.qbCustomers && client.qbCustomers.length > 1;
  const hasSingleLocation = client.qbCustomers && client.qbCustomers.length === 1;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {client.name?.charAt(0)?.toUpperCase() || 'C'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {client.name || 'Unnamed Client'}
        </Text>

        {client.email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color={colors.secondaryLabel} />
            <Text style={styles.infoText} numberOfLines={1}>{client.email}</Text>
          </View>
        )}

        {client.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={colors.secondaryLabel} />
            <Text style={styles.infoText}>{client.phone}</Text>
          </View>
        )}

        {/* Show single location */}
        {hasSingleLocation && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.secondaryLabel} />
            <Text style={styles.infoText} numberOfLines={1}>{client.qbCustomers[0].name}</Text>
          </View>
        )}

        {/* Show multiple locations count */}
        {hasMultipleLocations && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.infoTextPrimary}>
              {client.qbCustomers.length} locations
            </Text>
          </View>
        )}

        {/* Legacy: Show qbLocationName if no qbCustomers */}
        {!client.qbCustomers && client.qbLocationName && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={colors.secondaryLabel} />
            <Text style={styles.infoText} numberOfLines={1}>{client.qbLocationName}</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: colors.secondarySystemGroupedBackground,
    ...SHADOWS.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: colors.primary,
  },
  avatarText: {
    ...TYPOGRAPHY.title2,
    fontWeight: '700',
    color: colors.systemBackground,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.headline,
    marginBottom: SPACING.xs / 2,
    color: colors.label,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  infoText: {
    ...TYPOGRAPHY.caption1,
    flex: 1,
    color: colors.secondaryLabel,
  },
  infoTextPrimary: {
    ...TYPOGRAPHY.caption1,
    color: colors.primary,
    fontWeight: '600',
  },
  chevron: {
    color: colors.tertiaryLabel,
  },
});
