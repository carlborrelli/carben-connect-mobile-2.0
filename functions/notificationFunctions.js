/**
 * Push Notification Cloud Functions
 * Triggers for sending push notifications on various events
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendPushNotification, sendPushNotifications } = require('./sendPushNotification');

/**
 * Send notification when a new message is created
 * Notifies the recipient of the message
 */
exports.onMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data();
      const messageId = context.params.messageId;

      console.log('[Notification] New message created:', messageId);

      // Determine who to notify (not the sender)
      const projectDoc = await admin.firestore().collection('projects').doc(message.projectId).get();

      if (!projectDoc.exists) {
        console.log('[Notification] Project not found for message');
        return null;
      }

      const project = projectDoc.data();

      // Get recipient IDs (everyone on the project except the sender)
      const recipientIds = [];

      if (project.clientId && project.clientId !== message.senderId) {
        recipientIds.push(project.clientId);
      }

      if (project.contractorIds) {
        project.contractorIds.forEach(id => {
          if (id !== message.senderId) {
            recipientIds.push(id);
          }
        });
      }

      if (recipientIds.length === 0) {
        console.log('[Notification] No recipients to notify');
        return null;
      }

      // Get push tokens for recipients
      const userDocs = await Promise.all(
        recipientIds.map(id => admin.firestore().collection('users').doc(id).get())
      );

      const pushTokens = userDocs
        .filter(doc => doc.exists && doc.data().expoPushToken)
        .map(doc => doc.data().expoPushToken);

      if (pushTokens.length === 0) {
        console.log('[Notification] No push tokens found for recipients');
        return null;
      }

      // Send notification
      await sendPushNotifications(pushTokens, {
        title: `New message from ${message.senderName}`,
        body: message.message || message.text || 'Tap to view',
        data: {
          type: 'message',
          messageId: messageId,
          projectId: message.projectId,
          projectTitle: project.title,
        },
      });

      console.log(`[Notification] Sent message notification to ${pushTokens.length} devices`);
      return null;

    } catch (error) {
      console.error('[Notification] Error sending message notification:', error);
      return null;
    }
  });

/**
 * Send notification when an estimate is created or updated
 * Notifies the client
 */
exports.onEstimateCreated = functions.firestore
  .document('estimates/{estimateId}')
  .onCreate(async (snap, context) => {
    try {
      const estimate = snap.data();
      const estimateId = context.params.estimateId;

      console.log('[Notification] New estimate created:', estimateId);

      // Get project to find client
      const projectDoc = await admin.firestore().collection('projects').doc(estimate.projectId).get();

      if (!projectDoc.exists) {
        console.log('[Notification] Project not found for estimate');
        return null;
      }

      const project = projectDoc.data();

      if (!project.clientId) {
        console.log('[Notification] No client ID on project');
        return null;
      }

      // Get client's push token
      const clientDoc = await admin.firestore().collection('users').doc(project.clientId).get();

      if (!clientDoc.exists || !clientDoc.data().expoPushToken) {
        console.log('[Notification] No push token for client');
        return null;
      }

      const pushToken = clientDoc.data().expoPushToken;

      // Send notification
      await sendPushNotification(pushToken, {
        title: 'New Estimate Available',
        body: `An estimate for "${project.title}" is ready to review`,
        data: {
          type: 'estimate',
          estimateId: estimateId,
          projectId: estimate.projectId,
          projectTitle: project.title,
        },
      });

      console.log('[Notification] Sent estimate notification to client');
      return null;

    } catch (error) {
      console.error('[Notification] Error sending estimate notification:', error);
      return null;
    }
  });

/**
 * Send notification when a new project is created
 * Notifies all admins (contractors)
 */
exports.onProjectCreated = functions.firestore
  .document('projects/{projectId}')
  .onCreate(async (snap, context) => {
    try {
      const project = snap.data();
      const projectId = context.params.projectId;

      console.log('[Notification] New project created:', projectId);

      // Get all admin users
      const adminSnapshot = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      if (adminSnapshot.empty) {
        console.log('[Notification] No admins found');
        return null;
      }

      // Get push tokens for all admins
      const pushTokens = adminSnapshot.docs
        .filter(doc => doc.data().expoPushToken)
        .map(doc => doc.data().expoPushToken);

      if (pushTokens.length === 0) {
        console.log('[Notification] No push tokens found for admins');
        return null;
      }

      // Send notification
      await sendPushNotifications(pushTokens, {
        title: 'New Project Created',
        body: project.title || 'A new project has been submitted',
        data: {
          type: 'project',
          projectId: projectId,
          projectTitle: project.title,
          status: project.status,
        },
      });

      console.log(`[Notification] Sent new project notification to ${pushTokens.length} admins`);
      return null;

    } catch (error) {
      console.error('[Notification] Error sending project notification:', error);
      return null;
    }
  });
