// sendPushNotification.js - Helper function to send Expo push notifications
const fetch = require('node-fetch');

/**
 * Send a push notification via Expo's push notification service
 * @param {string} expoPushToken - The Expo push token for the device
 * @param {object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data payload
 */
async function sendPushNotification(expoPushToken, notification) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    priority: 'high',
    channelId: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notifications to multiple devices
 * @param {Array<string>} expoPushTokens - Array of Expo push tokens
 * @param {object} notification - Notification details
 */
async function sendPushNotifications(expoPushTokens, notification) {
  const messages = expoPushTokens
    .filter(token => token && token.startsWith('ExponentPushToken'))
    .map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high',
      channelId: 'default',
    }));

  if (messages.length === 0) {
    console.log('No valid push tokens to send to');
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log(`Push notifications sent to ${messages.length} devices:`, result);
    return result;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    throw error;
  }
}

module.exports = {
  sendPushNotification,
  sendPushNotifications,
};
