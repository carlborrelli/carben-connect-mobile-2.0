// Carben Connect Mobile 2.0 - Main App Entry
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { QuickBooksProvider } from './contexts/QuickBooksContext';
import Navigation from './navigation';
import LoginScreen from './screens/LoginScreen';
import ViewModeBanner from './components/ViewModeBanner';

// Main app content (conditionally renders login or navigation)
function AppContent() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.systemBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Show main navigation if authenticated
  return (
    <>
      <ViewModeBanner />
      <Navigation />
    </>
  );
}

// Root app component
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuickBooksProvider>
          <StatusBar style="auto" />
          <AppContent />
        </QuickBooksProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
