// NewMessageScreen - Create a new message
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function NewMessageScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Pre-select project if passed from route
  useEffect(() => {
    if (route?.params?.projectId && route?.params?.projectTitle) {
      setSelectedProject({
        id: route.params.projectId,
        title: route.params.projectTitle,
      });
    }
  }, [route?.params]);

  // Load user's projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        let projectsQuery;

        if (isAdmin()) {
          // Admin sees all projects
          projectsQuery = query(collection(db, 'projects'));
        } else {
          // Client sees only their projects
          projectsQuery = query(
            collection(db, 'projects'),
            where('clientId', '==', userProfile.id)
          );
        }

        const snapshot = await getDocs(projectsQuery);
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    if (userProfile) {
      loadProjects();
    }
  }, [userProfile]);

  const handleSend = async () => {
    if (!message.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const messageData = {
        senderId: userProfile.id,
        senderName: userProfile.name,
        senderRole: userProfile.role,
        message: message.trim(),
        text: message.trim(), // Compatibility field
        createdAt: new Date(),
        read: false,
        unread: true,
      };

      // If project is selected, add project info
      if (selectedProject) {
        messageData.projectId = selectedProject.id;
        messageData.projectTitle = selectedProject.title;

        // Get the project to find clientId
        const projectSnapshot = await getDocs(
          query(collection(db, 'projects'), where('__name__', '==', selectedProject.id))
        );

        if (!projectSnapshot.empty) {
          const project = projectSnapshot.docs[0].data();
          messageData.clientId = project.clientId;
        }
      } else {
        // General message - set clientId if user is client
        if (!isAdmin()) {
          messageData.clientId = userProfile.id;
        }
      }

      await addDoc(collection(db, 'messages'), messageData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (selectedProject) {
        // Navigate to conversation
        navigation.replace('Conversation', {
          projectId: selectedProject.id,
          projectTitle: selectedProject.title,
          clientId: messageData.clientId,
        });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProject(project);
    setShowProjectPicker(false);
  };

  const handleClearProject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProject(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.label} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Project Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Project (Optional)</Text>

          {selectedProject ? (
            <View style={styles.selectedProject}>
              <View style={styles.selectedProjectInfo}>
                <Ionicons name="folder" size={20} color={colors.primary} />
                <Text style={styles.selectedProjectText}>{selectedProject.title}</Text>
              </View>
              <TouchableOpacity onPress={handleClearProject}>
                <Ionicons name="close-circle" size={24} color={colors.secondaryLabel} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowProjectPicker(!showProjectPicker)}
              disabled={loadingProjects}
            >
              <Text style={styles.selectButtonText}>
                {loadingProjects ? 'Loading projects...' : 'Select a project (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.secondaryLabel} />
            </TouchableOpacity>
          )}

          {showProjectPicker && !selectedProject && (
            <View style={styles.picker}>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowProjectPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: colors.secondaryLabel }]}>
                    No project (general message)
                  </Text>
                </TouchableOpacity>
                {projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.pickerItem}
                    onPress={() => handleSelectProject(project)}
                  >
                    <Text style={styles.pickerItemText}>{project.title}</Text>
                    {project.status && (
                      <Text style={styles.pickerItemSubtext}>{project.status}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Type your message..."
            placeholderTextColor={colors.tertiaryLabel}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.blue} />
          <Text style={styles.infoCardText}>
            {selectedProject
              ? 'This message will be sent as part of the selected project conversation.'
              : 'Send a general message that will appear in your inbox.'}
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.systemBackground} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.systemBackground} />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: colors.label,
    minHeight: 44,
  },
  textArea: {
    minHeight: 200,
    paddingTop: SPACING.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  selectButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.tertiaryLabel,
  },
  selectedProject: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  selectedProjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  selectedProjectText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    flex: 1,
  },
  picker: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    maxHeight: 200,
    ...SHADOWS.small,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  pickerItemText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  pickerItemSubtext: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.blue + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  infoCardText: {
    ...TYPOGRAPHY.footnote,
    color: colors.blue,
    flex: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.blue,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
    shadowColor: colors.blue,
  },
  sendButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.systemBackground,
    fontWeight: '700',
  },
});
