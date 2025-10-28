// ConversationScreen - View conversation for a specific project
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ConversationScreen({ route, navigation }) {
  const { projectId, projectTitle } = route.params;
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputContentHeight, setInputContentHeight] = useState(44);
  const flatListRef = useRef(null);

  // Auto-grow input: min 44px, max ~6 lines (140px)
  const MIN_INPUT = 44;
  const MAX_INPUT = 140;
  const inputHeightStyle = Math.min(MAX_INPUT, Math.max(MIN_INPUT, inputContentHeight));
  const inputShouldScroll = inputContentHeight > MAX_INPUT;

  // Track keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt in JavaScript
        messagesData.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeA - timeB;
        });

        setMessages(messagesData);
        setLoading(false);

        // Scroll to bottom when new messages arrive
        if (messagesData.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      },
      (error) => {
        console.error('Error loading conversation:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const trimmedMessage = messageText.trim();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setMessageText('');

    try {
      await addDoc(collection(db, 'messages'), {
        projectId: projectId,
        projectTitle: projectTitle,
        senderId: userProfile.id,
        senderName: userProfile.name,
        senderRole: userProfile.role || 'client',
        message: trimmedMessage,
        text: trimmedMessage,
        createdAt: new Date(),
        read: false,
        unread: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending message:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessageText(trimmedMessage);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === userProfile?.id;
    const showDate = index === 0 ||
      (messages[index - 1] &&
       formatDate(item.createdAt) !== formatDate(messages[index - 1].createdAt));

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.sentBubble : styles.receivedBubble
        ]}>
          {!isCurrentUser && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.sentText : styles.receivedText
          ]}>
            {item.message || item.text}
          </Text>
          <Text style={[
            styles.timeText,
            isCurrentUser ? styles.sentTime : styles.receivedTime
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // Add tab bar height only when keyboard is hidden
  const extraBottom = keyboardVisible ? 0 : tabBarHeight;
  const inputPadBottom = SPACING.md + insets.bottom + extraBottom;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{projectTitle || 'Conversation'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{projectTitle || 'Conversation'}</Text>
          <Text style={styles.headerSubtitle}>{messages.length} messages</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.tertiaryLabel} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation about this project
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: inputHeight }
            ]}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
            scrollIndicatorInsets={{ bottom: inputHeight }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Docked Input Bar */}
        <View
          onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
          style={[styles.inputContainer, { paddingBottom: inputPadBottom }]}
        >
          <TextInput
            style={[styles.input, { height: inputHeightStyle }]}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.tertiaryLabel}
            value={messageText}
            onChangeText={setMessageText}
            onContentSizeChange={(e) => setInputContentHeight(e.nativeEvent.contentSize.height)}
            multiline
            maxLength={1000}
            editable={!sending}
            scrollEnabled={inputShouldScroll}
            textAlignVertical="top"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={messageText.trim() ? COLORS.systemBackground : COLORS.tertiaryLabel}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: SPACING.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dateText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    backgroundColor: COLORS.tertiarySystemBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  sentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  senderName: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xs / 2,
  },
  sentText: {
    color: COLORS.systemBackground,
  },
  receivedText: {
    color: COLORS.label,
  },
  timeText: {
    ...TYPOGRAPHY.caption2,
  },
  sentTime: {
    color: COLORS.systemBackground + 'CC',
    textAlign: 'right',
  },
  receivedTime: {
    color: COLORS.tertiaryLabel,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.title2,
    color: COLORS.label,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.secondarySystemBackground,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.sm,
    color: COLORS.label,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.tertiarySystemBackground,
  },
});
