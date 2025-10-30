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
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [importing, setImporting] = useState(false);

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

  const handleImportDescription = async () => {
    if (!project?.description) {
      Alert.alert('No Description', 'Project needs a description to import');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImporting(true);

    try {
      // Import description as-is
      setEstimateText(project.description);

      // Save to Firestore
      await setDoc(doc(db, 'estimateDescriptions', projectId), {
        description: project.description,
        aiGeneratedText: null,
        finalizedText: project.description,
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
    } catch (error) {
      console.error('Import Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Import Failed', 'Failed to import description');
    } finally {
      setImporting(false);
    }
  };

  const handleImportWithAI = async () => {
    if (!project?.description) {
      Alert.alert('No Description', 'Project needs a description to enhance with AI');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImporting(true);

    try {
      const result = await generateEstimate(project.description, additionalInstructions);

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
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI Import Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'AI Import Failed',
        error.message || 'Failed to generate estimate. Please check your OpenAI API key configuration.',
        [{ text: 'OK' }]
      );
    } finally {
      setImporting(false);
    }
  };

  const toggleInstructions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowInstructions(!showInstructions);
  };

  const toggleChat = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowChat(!showChat);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);

    setSendingMessage(true);

    try {
      // Build context for AI
      let contextParts = [];
      if (project?.description) {
        contextParts.push(`Original Project: ${project.description}`);
      }
      if (estimateText) {
        contextParts.push(`Current Estimate: ${estimateText}`);
      }
      if (additionalInstructions) {
        contextParts.push(`Special Instructions: ${additionalInstructions}`);
      }

      const systemContext = contextParts.length > 0
        ? `You are helping create a construction estimate. Context:\n${contextParts.join('\n\n')}\n\nProvide helpful, concise advice about the estimate.`
        : 'You are helping create a construction estimate. Provide helpful, concise advice.';

      const response = await fetch('https://www.carbenconnect.com/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages,
          systemContext: systemContext,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage = { role: 'assistant', content: data.response };
        setChatMessages(prev => [...prev, assistantMessage]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
      // Remove the user message if failed
      setChatMessages(prev => prev.slice(0, -1));
      // Restore the input
      setChatInput(userMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleToggleFinalize = async () => {
    if (!estimateText.trim()) {
      Alert.alert('No Estimate', 'Please write an estimate first');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const newFinalizedState = !description?.isFinalized;

      await setDoc(doc(db, 'estimateDescriptions', projectId), {
        description: project?.description || '',
        aiGeneratedText: description?.aiGeneratedText || null,
        finalizedText: estimateText,
        isFinalized: newFinalizedState,
        ...(newFinalizedState ? {
          finalizedAt: serverTimestamp(),
          finalizedBy: user.uid,
        } : {}),
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user.uid,
      });

      await setDoc(doc(db, 'estimateProgress', projectId), {
        descriptionGenerated: true,
        descriptionFinalized: newFinalizedState,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user.uid,
      }, { merge: true });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error toggling finalize:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update estimate status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isFinalized = description?.isFinalized;
  const hasText = estimateText.trim().length > 0;
  const hasProjectDescription = project?.description && project.description.trim().length > 0;

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

        {/* AI Tools Row - Instructions & Assistant */}
        <View style={styles.aiToolsRow}>
          {/* AI Instructions */}
          <TouchableOpacity
            style={styles.aiToolToggle}
            onPress={toggleInstructions}
            activeOpacity={0.7}
          >
            <View style={styles.aiToolToggleLeft}>
              <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              <Text style={styles.aiToolToggleText}>AI Instructions</Text>
            </View>
            <Ionicons
              name={showInstructions ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.gray2}
            />
          </TouchableOpacity>

          {/* AI Assistant */}
          <TouchableOpacity
            style={styles.aiToolToggle}
            onPress={toggleChat}
            activeOpacity={0.7}
          >
            <View style={styles.aiToolToggleLeft}>
              <Ionicons name="chatbubbles-outline" size={18} color={COLORS.primary} />
              <Text style={styles.aiToolToggleText}>AI Assistant</Text>
            </View>
            <Ionicons
              name={showChat ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.gray2}
            />
          </TouchableOpacity>
        </View>

        {/* AI Instructions Content */}
        {showInstructions && (
          <View style={styles.aiToolContainer}>
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

        {/* AI Assistant Content */}
        {showChat && (
          <View style={styles.aiToolContainer}>
            <ScrollView
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.quaternaryLabel} />
                  <Text style={styles.chatEmptyText}>Ask me anything about your estimate!</Text>
                  <Text style={styles.chatEmptySubtext}>I have context about your project</Text>
                </View>
              ) : (
                chatMessages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chatBubble,
                      msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                    ]}
                  >
                    <Text style={[
                      styles.chatBubbleText,
                      msg.role === 'user' && { color: COLORS.systemBackground }
                    ]}>
                      {msg.content}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask a question..."
                placeholderTextColor={COLORS.quaternaryLabel}
                multiline
                maxLength={500}
                onSubmitEditing={sendChatMessage}
              />
              <TouchableOpacity
                style={[styles.chatSendButton, (!chatInput.trim() || sendingMessage) && styles.buttonDisabled]}
                onPress={sendChatMessage}
                disabled={!chatInput.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color={COLORS.systemBackground} />
                ) : (
                  <Ionicons name="send" size={20} color={COLORS.systemBackground} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Import Buttons Row */}
        <View style={styles.importButtonsRow}>
          <TouchableOpacity
            style={[styles.importButton, styles.importButtonLeft, (importing || !hasProjectDescription) && styles.buttonDisabled]}
            onPress={handleImportDescription}
            disabled={importing || !hasProjectDescription}
          >
            {importing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                <Text style={styles.importButtonText}>Import Description</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.importButton, styles.importButtonRight, (importing || !hasProjectDescription) && styles.buttonDisabled]}
            onPress={handleImportWithAI}
            disabled={importing || !hasProjectDescription}
          >
            {importing ? (
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.systemBackground} />
                <Text style={styles.importButtonTextPrimary}>Import with AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {!hasProjectDescription && (
          <Text style={styles.helpText}>
            Project needs a description before you can import. Go back and add a description to the project.
          </Text>
        )}

        {/* Finalize/Edit Toggle Button */}
        {hasText && (
          <TouchableOpacity
            style={[
              isFinalized ? styles.editButton : styles.finalizeButton,
              saving && styles.buttonDisabled
            ]}
            onPress={handleToggleFinalize}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
            ) : (
              <>
                <Ionicons
                  name={isFinalized ? "create-outline" : "checkmark-circle"}
                  size={20}
                  color={COLORS.systemBackground}
                />
                <Text style={styles.finalizeButtonText}>
                  {isFinalized ? 'Edit Estimate' : 'Finalize Estimate'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.estimateSection}>
          <View style={styles.estimateLabelRow}>
            <Text style={styles.sectionLabel}>ESTIMATE DESCRIPTION</Text>
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
            placeholder="Type or paste your estimate here, or use the import buttons above..."
            placeholderTextColor={COLORS.quaternaryLabel}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  scrollView: { 
    flex: 1,
  },
  content: { 
    padding: SPACING.md,
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
    marginBottom: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: COLORS.green,
  },
  aiToolsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  aiToolToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  aiToolToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  aiToolToggleText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.label,
    fontWeight: '600',
  },
  aiToolContainer: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
    overflow: 'hidden',
  },
  instructionsInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    padding: SPACING.md,
    minHeight: 100,
  },
  chatMessages: {
    maxHeight: 300,
    minHeight: 150,
  },
  chatMessagesContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  chatEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  chatEmptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
  },
  chatEmptySubtext: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.quaternaryLabel,
  },
  chatBubble: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    maxWidth: '80%',
  },
  chatBubbleUser: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  chatBubbleAssistant: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    alignSelf: 'flex-start',
  },
  chatBubbleText: {
    ...TYPOGRAPHY.body,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  chatInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flex: 1,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  chatSendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  importButtonLeft: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  importButtonRight: {
    backgroundColor: COLORS.primary,
  },
  importButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    fontSize: 15,
  },
  importButtonTextPrimary: {
    ...TYPOGRAPHY.headline,
    color: COLORS.systemBackground,
    fontSize: 15,
  },
  helpText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  finalizeButton: { 
    backgroundColor: COLORS.green, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  editButton: { 
    backgroundColor: COLORS.blue, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  estimateSection: { 
    flex: 1,
  },
  estimateLabelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.sm,
  },
  sectionLabel: { 
    ...TYPOGRAPHY.caption1, 
    fontWeight: '700', 
    color: COLORS.secondaryLabel, 
    letterSpacing: 0.5,
  },
  autoSaveIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  autoSaveText: { 
    ...TYPOGRAPHY.caption2, 
    color: COLORS.secondaryLabel, 
    fontSize: 11,
  },
  estimateTextInput: { 
    ...TYPOGRAPHY.body, 
    color: COLORS.label, 
    backgroundColor: COLORS.systemBackground, 
    borderRadius: RADIUS.md, 
    padding: SPACING.md, 
    minHeight: 300, 
    borderWidth: 1, 
    borderColor: COLORS.separator,
  },
  buttonDisabled: { 
    opacity: 0.5,
  },
  finalizeButtonText: { 
    ...TYPOGRAPHY.headline, 
    color: COLORS.systemBackground,
  },
});
