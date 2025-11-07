// QuickBooksContext - Manages QuickBooks connection and automatic token refresh
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { useAuth } from './AuthContext';

const QuickBooksContext = createContext();

export function useQuickBooks() {
  const context = useContext(QuickBooksContext);
  if (!context) {
    throw new Error('useQuickBooks must be used within QuickBooksProvider');
  }
  return context;
}

export function QuickBooksProvider({ children }) {
  const { user } = useAuth();
  const [qbSettings, setQbSettings] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshCheck, setLastRefreshCheck] = useState(null);

  // Listen to QuickBooks settings changes
  useEffect(() => {
    if (!user) {
      setQbSettings(null);
      setIsConnected(false);
      return;
    }

    // Only admins need to manage QB connection
    if (user.role !== 'admin') {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'quickbooks'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQbSettings(data);

          // Check if connected (has valid tokens and is enabled)
          const connected = data.enabled &&
                          data.accessToken &&
                          data.refreshToken &&
                          data.tokenExpiry;

          setIsConnected(connected);

          // Check if token needs refresh on settings update
          if (connected) {
            checkAndRefreshToken(data);
          }
        } else {
          setQbSettings(null);
          setIsConnected(false);
        }
      },
      (error) => {
        console.error('Error listening to QuickBooks settings:', error);
        setQbSettings(null);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to app state changes and check token when app comes to foreground
  useEffect(() => {
    if (!user || user.role !== 'admin' || !isConnected) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App became active, checking QuickBooks token...');
        checkAndRefreshToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, isConnected, qbSettings]);

  // Check token expiry and refresh if needed
  const checkAndRefreshToken = async (settings = qbSettings) => {
    if (!settings || !settings.tokenExpiry || isRefreshing) {
      return;
    }

    try {
      const expiryDate = new Date(settings.tokenExpiry);
      const now = new Date();
      const minutesUntilExpiry = (expiryDate - now) / (1000 * 60);

      // Refresh if token expires in less than 30 minutes
      if (minutesUntilExpiry < 30) {
        console.log('QuickBooks token expiring soon, refreshing...');
        await refreshToken();
      }
    } catch (error) {
      console.error('Error checking token expiry:', error);
    }
  };

  // Refresh the access token
  const refreshToken = async () => {
    if (isRefreshing) {
      console.log('Token refresh already in progress');
      return;
    }

    setIsRefreshing(true);
    setLastRefreshCheck(new Date());

    try {
      const refreshQuickBooksToken = httpsCallable(functions, 'refreshQuickBooksToken');
      const result = await refreshQuickBooksToken();

      console.log('QuickBooks token refreshed:', result.data.message);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to refresh QuickBooks token:', error);

      // If refresh token is invalid, user needs to reconnect
      if (error.message && error.message.includes('Token refresh failed')) {
        setIsConnected(false);
      }

      return { success: false, error: error.message };
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual refresh (for testing or forced refresh)
  const forceRefresh = async () => {
    return await refreshToken();
  };

  const value = {
    qbSettings,
    isConnected,
    isRefreshing,
    lastRefreshCheck,
    checkAndRefreshToken,
    refreshToken,
    forceRefresh,
  };

  return (
    <QuickBooksContext.Provider value={value}>
      {children}
    </QuickBooksContext.Provider>
  );
}
