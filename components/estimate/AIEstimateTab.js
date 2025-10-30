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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';
import { generateEstimate } from '../../config/openai';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AIEstimateTab({ projectId, project, estimateProgress }) {
  const { user } = useAuth();
  const [description, setDescription] = useState(null);
  const [estimateText, setEstimateText] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'estimateDescriptions', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDescription(data);
          setEstimateText(data.finalizedText || data.aiGeneratedText || '');
        } else {
          setEstimateText('');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching description:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Auto-save estimate text
  useEffect(() => {
    if (loading || !estimateText) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'estimateDescriptions', projectId), {
          description: project?.description || '',
          aiGeneratedText: description?.aiGeneratedText || null,
          finalizedText: estimateText,
          isFinalized: description?.isFinalized || false,
          lastEditedAt: serverTimestamp(),
          lastEditedBy: user.uid,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [estimateText]);

  const toggleInstructions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInstructions(!showInstructions);
  };

  const handleGenerateEstimate = async () => {
    if (!project?.description) {
      Alert.alert('No Description', 'Project needs a description to generate an estimate');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      const result = await generateEstimate(
        project.description,
        additionalInstructions
      );

      if (result.success) {
        setEstimateText(result.estimate);

        // Save to Firestore
        await setDoc(doc(db, 'estimateDescriptions', projectId), {
          description: project.description,
          aiGeneratedText: result.estimate,
          finalizedText: result.estimate,
          isFinalized: false,
          lastEditedAt: serverTimestamp(),
          lastEditedBy: user.uid,
        });

        await setDoc(doc(db, 'estimateProgress', projectId), {
          descriptionGenerated: true,
          lastEditedAt: serverTimestamp(),
          lastEditedBy: user.uid,
        }, { merge: true });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'AI estimate generated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Generation Failed',
        error.message || 'Failed to generate estimate. Please check your OpenAI API key configuration.',
        [{ text: 'OK' }]
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!estimateText.trim()) {
      Alert.alert('No Estimate', 'Please write an estimate first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Finalize Estimate',
      'This will lock the estimate and allow you to proceed to pricing. You can still edit it later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          style: 'default',
          onPress: async () => {
            setSaving(true);
            try {
              await setDoc(doc(db, 'estimateDescriptions', projectId), {
                description: project?.description || '',
                aiGeneratedText: null,
                finalizedText: estimateText,
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
              Alert.alert('Success', 'Estimate finalized! You can now proceed to the calculator.');
            } catch (error) {
              console.error('Error finalizing:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to finalize estimate');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isFinalized = description?.isFinalized;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isFinalized && (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
            <Text style={styles.statusText}>Finalized</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.instructionsToggle}
          onPress={toggleInstructions}
          activeOpacity={0.7}
        >
          <View style={styles.instructionsToggleLeft}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.instructionsToggleText}>Additional Instructions</Text>
          </View>
          <Ionicons
            name={showInstructions ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.gray2}
          />
        </TouchableOpacity>

        {showInstructions && (
          <View style={styles.instructionsContainer}>
            <TextInput
              style={styles.instructionsInput}
              value={additionalInstructions}
              onChangeText={setAdditionalInstructions}
              placeholder="Add specific instructions for AI (e.g., 'Include 2-year warranty', 'Use premium materials')..."
              placeholderTextColor={COLORS.quaternaryLabel}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={handleGenerateEstimate}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={COLORS.systemBackground} />
              <Text style={styles.generateButtonText}>
                {isFinalized ? 'Re-Generate Estimate with AI' : 'Generate Estimate with AI'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.estimateSection}>
          <View style={styles.estimateLabelRow}>
            <Text style={styles.sectionLabel}>ESTIMATE</Text>
            {lastSaved && !isFinalized && (
              <View style={styles.autoSaveIndicator}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.green} />
                <Text style={styles.autoSaveText}>
                  Saved {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.estimateTextInput}
            value={estimateText}
            onChangeText={(text) => {
              setEstimateText(text);
              // If finalized and user edits, auto-unfinalize
              if (isFinalized) {
                setDoc(doc(db, 'estimateDescriptions', projectId), {
                  ...description,
                  isFinalized: false,
                });
                setDoc(doc(db, 'estimateProgress', projectId), {
                  descriptionFinalized: false,
                }, { merge: true });
              }
            }}
            placeholder="Type or paste your estimate here..."
            placeholderTextColor={COLORS.quaternaryLabel}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            isFinalized ? styles.refinalizeButton : styles.finalizeButton,
            saving && styles.buttonDisabled
          ]}
          onPress={handleFinalize}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.systemBackground} />
          ) : (
            <>
              <Ionicons
                name={isFinalized ? "refresh-circle" : "checkmark-circle"}
                size={20}
                color={COLORS.systemBackground}
              />
              <Text style={styles.finalizeButtonText}>
                {isFinalized ? 'Re-Finalize Estimate' : 'Finalize Estimate'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  content: { padding: SPACING.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(52, 199, 89, 0.15)', paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.md, gap: 6, marginBottom: SPACING.md },
  statusText: { ...TYPOGRAPHY.caption1, fontWeight: '600', color: COLORS.green },
  instructionsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.systemBackground, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.separator },
  instructionsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  instructionsToggleText: { ...TYPOGRAPHY.body, color: COLORS.label },
  instructionsContainer: { marginBottom: SPACING.md },
  instructionsInput: { ...TYPOGRAPHY.body, color: COLORS.label, backgroundColor: COLORS.systemBackground, borderRadius: RADIUS.md, padding: SPACING.md, minHeight: 100, borderWidth: 1, borderColor: COLORS.separator },
  generateButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm, marginBottom: SPACING.md },
  generateButtonText: { ...TYPOGRAPHY.headline, color: COLORS.systemBackground },
  estimateSection: { flex: 1 },
  estimateLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionLabel: { ...TYPOGRAPHY.caption1, fontWeight: '700', color: COLORS.secondaryLabel, letterSpacing: 0.5 },
  autoSaveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  autoSaveText: { ...TYPOGRAPHY.caption2, color: COLORS.secondaryLabel, fontSize: 11 },
  estimateTextInput: { ...TYPOGRAPHY.body, color: COLORS.label, backgroundColor: COLORS.systemBackground, borderRadius: RADIUS.md, padding: SPACING.md, minHeight: 300, borderWidth: 1, borderColor: COLORS.separator },
  bottomBar: { backgroundColor: COLORS.systemBackground, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.separator, padding: SPACING.md },
  finalizeButton: { backgroundColor: COLORS.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm },
  refinalizeButton: { backgroundColor: COLORS.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm },
  buttonDisabled: { opacity: 0.5 },
  finalizeButtonText: { ...TYPOGRAPHY.headline, color: COLORS.systemBackground },
});
