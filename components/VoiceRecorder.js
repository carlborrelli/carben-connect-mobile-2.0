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
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function VoiceRecorder({ onTranscription, existingDescription, compact = false }) {
  const { colors } = useTheme();
  const styles = createStyles(colors, compact);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Update timer every second when recording
  useEffect(() => {
    console.log('useEffect triggered - recorderState.isRecording:', recorderState.isRecording);
    if (recorderState.isRecording) {
      console.log('Starting timer interval');
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      console.log('Clearing timer interval');
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
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    try {
      console.log('startRecording called');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request microphone permissions
      console.log('Requesting microphone permissions...');
      const permissionResponse = await requestRecordingPermissionsAsync();
      console.log('Permission response:', permissionResponse);

      if (!permissionResponse.granted) {
        console.log('Permission denied');
        Alert.alert('Permission Required', 'Please enable microphone access to use voice recording');
        return;
      }

      // Configure audio mode for recording on iOS
      console.log('Setting audio mode...');
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      console.log('Audio mode set successfully');

      // Prepare the recorder
      console.log('Preparing to record...');
      await audioRecorder.prepareToRecordAsync();
      console.log('Recorder prepared, canRecord:', recorderState.canRecord);

      // Start recording
      console.log('Starting recording...');
      await audioRecorder.record();
      console.log('Recording started successfully');
      console.log('recorderState after record():', JSON.stringify(recorderState, null, 2));
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to start recording:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.message.includes('permission') || error.message.includes('Permission')) {
        Alert.alert('Permission Required', 'Please enable microphone access to use voice recording');
      } else {
        Alert.alert('Error', 'Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setIsProcessing(true);

      console.log('Stopping recording...');
      console.log('recorderState before stop:', JSON.stringify(recorderState, null, 2));

      // Stop recording and get the recording object
      const recording = await audioRecorder.stop();
      console.log('Recording stopped, result:', JSON.stringify(recording, null, 2));

      // Reset audio mode after recording
      await setAudioModeAsync({
        playsInSilentMode: false,
        allowsRecording: false,
      });

      // The URI is in recorderState.url, not in the recording object
      const recordingUri = recorderState.url || recording?.uri;
      console.log('Recording URI to process:', recordingUri);

      if (!recordingUri) {
        throw new Error('No recording URI');
      }

      // Process the recording
      await processRecording(recordingUri);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setIsProcessing(false);

      // Make sure to reset audio mode even on error
      try {
        await setAudioModeAsync({
          playsInSilentMode: false,
          allowsRecording: false,
        });
      } catch (e) {
        // Ignore error
      }
    }
  };

  const processRecording = async (uri) => {
    try {
      console.log('Processing recording URI:', uri);

      // Step 1: Transcribe audio using Vercel API
      const formData = new FormData();

      // In React Native, FormData needs the file object with uri, type, and name
      formData.append('audio', {
        uri: uri,
        type: 'audio/mp4', // m4a is actually MPEG-4 audio
        name: 'recording.m4a'
      });

      const transcribeResponse = await fetch('https://carbenconnect.com/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || 'Failed to transcribe audio');
      }

      const transcribeData = await transcribeResponse.json();
      const transcription = transcribeData.text;
      console.log('Transcription:', transcription);

      // Step 2: Generate project details from transcription using Vercel API
      const generateResponse = await fetch('https://carbenconnect.com/api/ai/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: existingDescription
            ? `${existingDescription}\n\nAdditional information: ${transcription}`
            : transcription
        }),
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        throw new Error(error.error || 'Failed to generate project');
      }

      const generateData = await generateResponse.json();
      const { title, description, summary } = generateData;
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
          recorderState.isRecording && styles.recordButtonActive
        ]}
        onPress={recorderState.isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <View style={styles.recordButtonInner}>
          <Ionicons
            name={recorderState.isRecording ? 'stop' : 'mic'}
            size={compact ? 20 : 32}
            color={colors.systemBackground}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>
          {recorderState.isRecording ? 'Recording...' : 'Tap to Record'}
        </Text>
        {recorderState.isRecording && (
          <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
        )}
        <Text style={styles.infoSubtitle}>
          {recorderState.isRecording
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
