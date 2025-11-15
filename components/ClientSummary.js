// ClientSummary - AI-powered project summary for client homepage
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ClientSummary({ navigation }) {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (userProfile) {
      fetchSummary();
    }
  }, [userProfile]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const generateSummary = httpsCallable(functions, 'generateClientSummary');
      const result = await generateSummary({ userId: userProfile.id });

      setSummary(result.data.summary);
      setSource(result.data.source);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Unable to load summary');
      setLoading(false);
    }
  };

  const handleProjectLinkPress = (projectId) => {
    // Navigate to ProjectDetail within the current Home stack
    navigation.navigate('ProjectDetail', { projectId });
  };

  const renderSummaryWithLinks = () => {
    if (!summary) return null;

    // Parse the summary to detect project mentions in format: "Project Title[projectId]"
    const regex = /([^\[]+)\[([a-zA-Z0-9]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(summary)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: summary.substring(lastIndex, match.index)
        });
      }

      // Add the linked project name
      parts.push({
        type: 'link',
        content: match[1].trim(),
        projectId: match[2]
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < summary.length) {
      parts.push({
        type: 'text',
        content: summary.substring(lastIndex)
      });
    }

    return (
      <Text style={[styles.summaryText, { color: colors.label }]}>
        {parts.map((part, index) => {
          if (part.type === 'link') {
            return (
              <Text
                key={index}
                style={[styles.projectLink, { color: colors.primary }]}
                onPress={() => handleProjectLinkPress(part.projectId)}
              >
                {part.content}
              </Text>
            );
          } else {
            return <Text key={index}>{part.content}</Text>;
          }
        })}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.label }]}>Your Summary</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>
            Generating your personalized update...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={20} color={colors.systemRed} />
          <Text style={[styles.title, { color: colors.label }]}>Summary</Text>
        </View>
        <Text style={[styles.errorText, { color: colors.secondaryLabel }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSummary}>
          <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.label }]}>Your Summary</Text>
        {source && source.includes('cached') && (
          <Ionicons name="checkmark-circle" size={16} color={colors.systemGreen} style={styles.cacheIcon} />
        )}
      </View>
      {renderSummaryWithLinks()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontWeight: '600',
  },
  cacheIcon: {
    marginLeft: 'auto',
  },
  summaryText: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
  projectLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    ...TYPOGRAPHY.caption1,
    fontStyle: 'italic',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  retryText: {
    ...TYPOGRAPHY.callout,
    fontWeight: '600',
  },
});
