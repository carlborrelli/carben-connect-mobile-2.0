// NotificationContext - Manages push notifications
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Store navigation ref so we can navigate from anywhere
let navigationRef = null;

export function setNavigationRef(ref) {
  navigationRef = ref;
}

export function NotificationProvider({ children }) {
  const { user, userProfile, isViewingAsClient } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastNotificationResponse = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Store token in Firebase user document
        // Skip if viewing as client (admin impersonating)
        if (user && userProfile && !isViewingAsClient()) {
          updateDoc(doc(db, 'users', userProfile.id), {
            expoPushToken: token,
            deviceType: Platform.OS,
            updatedAt: new Date(),
          }).catch(error => {
            console.error('Error saving push token:', error);
          });
        }
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for user tapping on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      handleNotificationResponse(response);
    });

    // Check for notification that opened the app
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response && response !== lastNotificationResponse.current) {
          lastNotificationResponse.current = response;
          handleNotificationResponse(response);
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user, userProfile]);

  const handleNotificationResponse = (response) => {
    if (!navigationRef || !navigationRef.current) {
      console.log('Navigation ref not ready');
      return;
    }

    const data = response.notification.request.content.data;
    console.log('Navigating based on notification data:', data);

    // Navigate based on notification type
    switch (data.type) {
      case 'message':
        // First navigate to Inbox tab to establish the navigation stack
        navigationRef.current.navigate('Inbox');

        // Then navigate to the conversation with a small delay to ensure the tab is ready
        setTimeout(() => {
          navigationRef.current.navigate('Inbox', {
            screen: 'Conversation',
            params: {
              projectId: data.projectId || null,
              projectTitle: data.projectTitle || 'General Message',
              clientId: data.clientId
            }
          });
        }, 100);
        break;

      case 'estimate':
        // Navigate to the project/estimate
        if (data.projectId) {
          // First navigate to Projects tab
          navigationRef.current.navigate('Projects');

          // Then navigate to the specific project
          setTimeout(() => {
            navigationRef.current.navigate('Projects', {
              screen: 'ProjectDetail',
              params: {
                projectId: data.projectId
              }
            });
          }, 100);
        }
        break;

      case 'project':
        // Navigate to the new project
        if (data.projectId) {
          // First navigate to Projects tab
          navigationRef.current.navigate('Projects');

          // Then navigate to the specific project
          setTimeout(() => {
            navigationRef.current.navigate('Projects', {
              screen: 'ProjectDetail',
              params: {
                projectId: data.projectId
              }
            });
          }, 100);
        }
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the token that uniquely identifies this device
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'f0319be5-6c87-4175-b795-15d014c8217d'
    })).data;

    console.log('Expo Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
