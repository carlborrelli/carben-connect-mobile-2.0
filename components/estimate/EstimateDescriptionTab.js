import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme';

export default function EstimateDescriptionTab({ projectId, project, estimateProgress }) {
  const { user } = useAuth();
  const [description, setDescription] = useState(null);
  const [editableText, setEditableText] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Real-time listener for estimate description
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'estimateDescriptions', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDescription(data);
          setEditableText(data.finalizedText || data.aiGeneratedText || data.description || '');
        } else {
          // Initialize with project description
          const initialText = project?.description || '';
          setDescription({ description: initialText });
          setEditableText(initialText);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching description:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, project]);

  const handleGenerateWithAI = async () => {
    if (!editableText.trim()) {
      Alert.alert('Input Required', 'Please enter a project description first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      // TODO: Replace with actual AI API endpoint
      // For now, we'll use a placeholder
      const API_BASE_URL = 'https://your-api-url.com'; // Replace with actual API URL
      
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editableText,
          projectTitle: project?.title,
          clientName: project?.clientName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate estimate');
      }

      const data = await response.json();
      const aiGeneratedText = data.generatedText;

      // Save to Firestore
      await setDoc(doc(db, 'estimateDescriptions', projectId), {
        description: editableText,
        aiGeneratedText: aiGeneratedText,
        finalizedText: null,
        isFinalized: false,
        generatedAt: serverTimestamp(),
        generatedBy: user.uid,
      });

      // Update progress
      await setDoc(doc(db, 'estimateProgress', projectId), {
        descriptionGenerated: true,
        descriptionFinalized: false,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user.uid,
      }, { merge: true });

      setEditableText(aiGeneratedText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'AI has generated your estimate description!');
    } catch (error) {
      console.error('Error generating estimate:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to generate estimate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editableText.trim()) {
      Alert.alert('Input Required', 'Description cannot be empty');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);

    try {
      await setDoc(doc(db, 'estimateDescriptions', projectId), {
        ...description,
        finalizedText: editableText,
        isFinalized: false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving changes:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!editableText.trim()) {
      Alert.alert('Input Required', 'Description cannot be empty');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Finalize Description',
      'Are you sure you want to finalize this estimate description? You can still edit it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'default',
          onPress: async () => {
            try {
              await setDoc(doc(db, 'estimateDescriptions', projectId), {
                ...description,
                finalizedText: editableText,
                isFinalized: true,
                finalizedAt: serverTimestamp(),
                finalizedBy: user.uid,
              });

              await setDoc(doc(db, 'estimateProgress', projectId), {
                descriptionGenerated: true,
                descriptionFinalized: true,
                lastEditedAt: serverTimestamp(),
                lastEditedBy: user.uid,
              }, { merge: true });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Estimate description finalized!');
            } catch (error) {
              console.error('Error finalizing:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to finalize description');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const isFinalized = description?.isFinalized;
  const hasAIGenerated = !!description?.aiGeneratedText;

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      {hasAIGenerated && (
        <View style={[styles.statusBadge, isFinalized && styles.statusBadgeFinalized]}>
          <Ionicons
            name={isFinalized ? 'checkmark-circle' : 'sparkles'}
            size={16}
            color={isFinalized ? COLORS.green : COLORS.blue}
          />
          <Text style={[styles.statusText, isFinalized && styles.statusTextFinalized]}>
            {isFinalized ? 'Finalized' : 'AI Generated'}
          </Text>
        </View>
      )}

      {/* Text input */}
      <TextInput
        style={styles.textInput}
        value={editableText}
        onChangeText={setEditableText}
        placeholder="Describe the project work to be done..."
        placeholderTextColor={COLORS.tertiaryLabel}
        multiline
        textAlignVertical="top"
        editable={!generating && !saving}
      />

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {!hasAIGenerated ? (
          <TouchableOpacity
            style={[styles.primaryButton, generating && styles.buttonDisabled]}
            onPress={handleGenerateWithAI}
            disabled={generating || !editableText.trim()}
          >
            {generating ? (
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.systemBackground} />
                <Text style={styles.primaryButtonText}>Generate with AI</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, saving && styles.buttonDisabled]}
              onPress={handleSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>

            {!isFinalized && (
              <TouchableOpacity
                style={[styles.primaryButton, styles.finalizeButton]}
                onPress={handleFinalize}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.systemBackground} />
                <Text style={styles.primaryButtonText}>Finalize</Text>
              </TouchableOpacity>
            )}

            {isFinalized && (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.editButton]}
                onPress={async () => {
                  await setDoc(doc(db, 'estimateDescriptions', projectId), {
                    ...description,
                    isFinalized: false,
                  });
                  await setDoc(doc(db, 'estimateProgress', projectId), {
                    descriptionFinalized: false,
                  }, { merge: true });
                }}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.blue} />
                <Text style={[styles.secondaryButtonText, { color: COLORS.blue }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Help text */}
      <Text style={styles.helpText}>
        {!hasAIGenerated
          ? 'Start by entering a description of the work, then let AI generate a detailed estimate.'
          : isFinalized
            ? 'Description is finalized. You can still edit it if needed.'
            : 'Review the AI-generated text and make any edits before finalizing.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  statusBadgeFinalized: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: COLORS.blue,
  },
  statusTextFinalized: {
    color: COLORS.green,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  actionButtons: {
    gap: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    flex: 1,
  },
  finalizeButton: {
    backgroundColor: COLORS.green,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    flex: 1,
  },
  editButton: {
    borderColor: COLORS.blue,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.systemBackground,
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
  },
  helpText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    lineHeight: 16,
  },
});
