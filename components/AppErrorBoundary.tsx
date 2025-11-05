import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | undefined;
  errorInfo: React.ErrorInfo | undefined;
}

/**
 * Error Boundary component to catch and display React errors gracefully
 *
 * Prevents the entire app from crashing when a component throws an error.
 * Shows a friendly error screen with the option to retry.
 *
 * TODO: Integrate with Sentry or other error reporting service
 */
export class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // TODO: Send to error reporting service (Sentry, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ error: undefined, errorInfo: undefined });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            We encountered an unexpected error. This has been logged and we'll look into it.
          </Text>

          {__DEV__ && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorMessage} selectable>
                {this.state.error.toString()}
              </Text>
              {this.state.error.stack && (
                <Text style={styles.errorStack} selectable>
                  {this.state.error.stack}
                </Text>
              )}
            </View>
          )}

          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  errorMessage: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
