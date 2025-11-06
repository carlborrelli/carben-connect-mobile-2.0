// VoiceRecorder - Voice recording component for creating projects
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function VoiceRecorder({ onTranscription, existingDescription }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable microphone access to use voice recording');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Track duration
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(Math.floor(status.durationMillis / 1000));
        }
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!recording) return;

      setIsRecording(false);
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Process the recording
      await processRecording(uri);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const processRecording = async (uri) => {
    try {
      // Read the audio file
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve();
        reader.onerror = reject;
      });

      const base64Audio = reader.result.split(',')[1];

      // Step 1: Transcribe audio
      const transcribeAudio = httpsCallable(functions, 'transcribeAudio');
      const transcribeResult = await transcribeAudio({
        audioData: base64Audio,
        mimeType: 'audio/m4a'
      });

      const transcription = transcribeResult.data.text;
      console.log('Transcription:', transcription);

      // Step 2: Generate project details from transcription
      const generateProject = httpsCallable(functions, 'generateProject');
      const generateResult = await generateProject({
        transcription,
        existingDescription: existingDescription || null
      });

      const { title, description, summary } = generateResult.data;
      console.log('Generated:', { title, description, summary });

      // Step 3: Convert summary to speech and play it
      if (summary) {
        const textToSpeech = httpsCallable(functions, 'textToSpeech');
        const speechResult = await textToSpeech({ text: summary });

        const audioBase64 = speechResult.data.audioData;

        // Play the AI response
        await playAudioResponse(audioBase64);
      }

      // Call the callback with the generated data
      onTranscription({
        title,
        description,
        transcription,
        summary
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsProcessing(false);

    } catch (error) {
      console.error('Error processing recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = 'Failed to process recording. Please try again.';
      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'You must be logged in to use voice recording';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (base64Audio) => {
    try {
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });

      // Create a temporary URI
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      await new Promise((resolve) => {
        reader.onloadend = () => resolve();
      });

      // Play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: reader.result },
        { shouldPlay: true }
      );

      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });

    } catch (error) {
      console.error('Error playing audio response:', error);
      // Non-critical error, don't show to user
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingText}>Processing your voice...</Text>
        <Text style={styles.processingSubtext}>Transcribing and generating project details</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <View style={styles.recordButtonInner}>
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color={colors.systemBackground}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>
          {isRecording ? 'Recording...' : 'Tap to Record'}
        </Text>
        {isRecording && (
          <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
        )}
        <Text style={styles.infoSubtitle}>
          {isRecording
            ? 'Tap again to stop and process'
            : 'Describe your project using your voice'}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    shadowColor: colors.primary,
  },
  recordButtonActive: {
    backgroundColor: colors.red,
    shadowColor: colors.red,
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  infoTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
    fontWeight: '600',
  },
  duration: {
    ...TYPOGRAPHY.title2,
    color: colors.primary,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  infoSubtitle: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  processingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  processingText: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  processingSubtext: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
