import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';

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
    Alert.alert(
      'AI Generation',
      'AI estimate generation is coming soon. For now, you can write your description manually and finalize it.',
      [{ text: 'OK' }]
    );
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
        description: editableText,
        finalizedText: editableText,
        isFinalized: false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      // Update progress to show description started
      await setDoc(doc(db, 'estimateProgress', projectId), {
        descriptionGenerated: true,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user.uid,
      }, { merge: true });

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
      'Are you sure you want to finalize this estimate description? You can still edit it later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'default',
          onPress: async () => {
            try {
              await setDoc(doc(db, 'estimateDescriptions', projectId), {
                ...description,
                description: editableText,
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

  const handleUnfinalize = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setDoc(doc(db, 'estimateDescriptions', projectId), {
        ...description,
        isFinalized: false,
      });
      await setDoc(doc(db, 'estimateProgress', projectId), {
        descriptionFinalized: false,
      }, { merge: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error unfinalizing:', error);
      Alert.alert('Error', 'Failed to unfinalize description');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const isFinalized = description?.isFinalized;
  const hasText = editableText.trim().length > 0;

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Status indicator */}
      {isFinalized && (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
          <Text style={styles.statusText}>Finalized</Text>
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
        {/* AI Generate Button (optional) */}
        {!isFinalized && (
          <TouchableOpacity
            style={[styles.secondaryButton, generating && styles.buttonDisabled]}
            onPress={handleGenerateWithAI}
            disabled={generating || !hasText}
          >
            {generating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Generate with AI</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Main action buttons */}
        <View style={styles.buttonRow}>
          {/* Save Button */}
          {!isFinalized && (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.flex1, saving && styles.buttonDisabled]}
              onPress={handleSaveChanges}
              disabled={saving || !hasText}
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
          )}

          {/* Finalize Button */}
          {!isFinalized ? (
            <TouchableOpacity
              style={[styles.primaryButton, styles.finalizeButton, styles.flex1]}
              onPress={handleFinalize}
              disabled={!hasText}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.systemBackground} />
              <Text style={styles.primaryButtonText}>Finalize</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.editButton, styles.flex1]}
              onPress={handleUnfinalize}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.blue} />
              <Text style={[styles.secondaryButtonText, { color: COLORS.blue }]}>
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Help text */}
      <Text style={styles.helpText}>
        {!hasText
          ? 'Start by entering a description of the work to be done.'
          : isFinalized
            ? 'Description is finalized. Click "Edit" to make changes.'
            : 'Click "Finalize" when your description is ready.'}
      </Text>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: SPACING.md,
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
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
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
  flex1: {
    flex: 1,
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
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    fontWeight: '600',
  },
  helpText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    lineHeight: 16,
    textAlign: 'center',
  },
});
