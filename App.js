// Carben Connect Mobile 2.0 - Main App Entry
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './navigation';
import LoginScreen from './screens/LoginScreen';
import { COLORS } from './theme';

// Main app content (conditionally renders login or navigation)
function AppContent() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Show main navigation if authenticated
  return <Navigation />;
}

// Root app component
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.systemBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
