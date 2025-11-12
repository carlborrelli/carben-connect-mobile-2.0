// AuthContext - Manages user authentication state
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View as client feature
  const [viewingAsUser, setViewingAsUser] = useState(null); // The client being viewed
  const [originalAdmin, setOriginalAdmin] = useState(null); // Store original admin profile

  // Check for persisted auth on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load user profile from Firestore
  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = { id: uid, ...userDoc.data() };
        setUserProfile(profile);
        // Persist user profile to AsyncStorage
        await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserProfile(userCredential.user.uid);
      
      return { success: true };
    } catch (err) {
      let errorMessage = 'Failed to sign in';
      
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('userProfile');
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      return { success: false, error: 'Failed to sign out' };
    }
  };

  // Check if REAL user is admin (for permissions/features)
  const isRealAdmin = () => {
    if (originalAdmin) {
      // If viewing as client, check the original admin
      return originalAdmin.role === 'admin';
    }
    return userProfile?.role === 'admin';
  };

  // Check if CURRENT view is admin (for UI display)
  const isAdmin = () => {
    // When viewing as client, return false so UI shows client perspective
    if (viewingAsUser) {
      return false;
    }
    return userProfile?.role === 'admin';
  };

  // View as client - switches to client view
  const viewAsClient = async (clientId) => {
    if (!isRealAdmin()) {
      console.error('Only admins can view as client');
      return { success: false, error: 'Unauthorized' };
    }

    try {
      setLoading(true);

      // Load the client's profile
      const clientDoc = await getDoc(doc(db, 'users', clientId));
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }

      const clientProfile = { id: clientId, ...clientDoc.data() };

      // Store original admin if not already stored
      if (!originalAdmin) {
        setOriginalAdmin(userProfile);
      }

      // Switch to client view
      setViewingAsUser(clientProfile);
      setUserProfile(clientProfile); // This makes all queries use client's data

      return { success: true };
    } catch (err) {
      console.error('Error viewing as client:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Exit view as client - return to admin view
  const exitViewAsClient = () => {
    if (!originalAdmin) {
      console.error('Not currently viewing as client');
      return { success: false };
    }

    // Restore original admin profile
    setUserProfile(originalAdmin);
    setViewingAsUser(null);
    setOriginalAdmin(null);

    return { success: true };
  };

  // Get the effective user (for display purposes)
  const getEffectiveUser = () => {
    return viewingAsUser || userProfile;
  };

  // Check if currently viewing as client
  const isViewingAsClient = () => {
    return viewingAsUser !== null;
  };

  const value = {
    user,
    userProfile, // This is the "effective" profile (client if viewing as client, admin if not)
    originalAdmin, // The real admin user (null if not viewing as client)
    viewingAsUser, // The client being viewed (null if not viewing as client)
    loading,
    error,
    signIn,
    signOut,
    isAdmin, // Current view's role (false when viewing as client)
    isRealAdmin, // Real user's role (true even when viewing as client)
    viewAsClient,
    exitViewAsClient,
    getEffectiveUser,
    isViewingAsClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
