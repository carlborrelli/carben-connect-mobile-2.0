import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage wrapper using expo-secure-store
 * 
 * Uses iOS Keychain and Android EncryptedSharedPreferences
 * for storing sensitive session data.
 * 
 * IMPORTANT: This is for client-side session tokens only.
 * Long-lived provider secrets (QuickBooks, OpenAI, etc.) 
 * should NEVER be stored client-side.
 */

const KEYCHAIN_SERVICE = 'carbenconnect';

/**
 * Store a value securely
 */
async function set(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Fallback to localStorage on web (less secure)
      console.warn('[SecureStore] Using localStorage on web - not fully secure');
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value, {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch (error) {
    console.error('[SecureStore] Error storing value:', error);
    throw error;
  }
}

/**
 * Retrieve a value securely
 */
async function get(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }

    return await SecureStore.getItemAsync(key, {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch (error) {
    console.error('[SecureStore] Error retrieving value:', error);
    return null;
  }
}

/**
 * Delete a value
 */
async function remove(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key, {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch (error) {
    console.error('[SecureStore] Error deleting value:', error);
    throw error;
  }
}

/**
 * Common keys for session data
 */
export const SecureStoreKeys = {
  SESSION_TOKEN: 'session_token',
  USER_ID: 'user_id',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const secureStore = {
  set,
  get,
  remove,
};
