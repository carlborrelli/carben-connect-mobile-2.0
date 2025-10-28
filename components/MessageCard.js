// MessageCard - Display message preview grouped by project
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function MessageCard({ message, onPress }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(message);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isUnread = message.unread || false;

  return (
    <TouchableOpacity 
      style={[styles.card, isUnread && styles.unreadCard]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.projectTitle, isUnread && styles.unreadText]} numberOfLines={1}>
            {message.projectTitle || 'Unknown Project'}
          </Text>
          {message.clientName && (
            <Text style={styles.clientName} numberOfLines={1}>
              {message.clientName}
            </Text>
          )}
        </View>
        <Text style={styles.time}>{formatDate(message.createdAt)}</Text>
      </View>

      {/* Message preview */}
      <Text style={[styles.preview, isUnread && styles.unreadText]} numberOfLines={2}>
        {message.message || message.text || 'No message content'}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons 
            name={message.senderRole === 'admin' ? 'person' : 'person-outline'} 
            size={14} 
            color={COLORS.secondaryLabel} 
          />
          <Text style={styles.senderName}>
            {message.senderName || 'Unknown'}
          </Text>
        </View>
        {isUnread && (
          <View style={styles.unreadBadge}>
            <View style={styles.unreadDot} />
          </View>
        )}
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
  unreadCard: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  projectTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    marginBottom: SPACING.xs / 2,
  },
  unreadText: {
    fontWeight: '600',
  },
  clientName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  time: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  preview: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  senderName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  unreadBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
