// VoiceRecorder - Voice recording component for creating projects
import React, { useState, useEffect, useRef } from 'react';
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

export default function VoiceRecorder({ onTranscription, existingDescription, compact = false }) {
  const { colors } = useTheme();
  const styles = createStyles(colors, compact);

  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [recording]);

  // Update timer every second when recording
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

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

      // Call the callback with the generated data (including raw transcription)
      onTranscription({
        title,
        description,
        transcription,  // Raw transcription for admin inbox
        summary
      });

      // Success!
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
            size={compact ? 20 : 32}
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

const createStyles = (colors, compact) => StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: compact ? SPACING.md : SPACING.lg,
  },
  recordButton: {
    width: compact ? 60 : 80,
    height: compact ? 60 : 80,
    borderRadius: compact ? 30 : 40,
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
    width: compact ? 52 : 70,
    height: compact ? 52 : 70,
    borderRadius: compact ? 26 : 35,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  infoTitle: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
  duration: {
    ...TYPOGRAPHY.title3,
    color: colors.primary,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  infoSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  processingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  processingText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
    marginTop: SPACING.md,
  },
  processingSubtext: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
