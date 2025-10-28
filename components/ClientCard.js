// ClientCard - Display client information in a card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ClientCard({ client, onPress }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(client);
  };

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
            <Ionicons name="mail-outline" size={14} color={COLORS.secondaryLabel} />
            <Text style={styles.infoText} numberOfLines={1}>{client.email}</Text>
          </View>
        )}
        
        {client.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.secondaryLabel} />
            <Text style={styles.infoText}>{client.phone}</Text>
          </View>
        )}

        {client.qbLocationName && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.secondaryLabel} />
            <Text style={styles.infoText} numberOfLines={1}>{client.qbLocationName}</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={COLORS.tertiaryLabel} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.systemBackground,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    marginBottom: SPACING.xs / 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  infoText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    flex: 1,
  },
});
