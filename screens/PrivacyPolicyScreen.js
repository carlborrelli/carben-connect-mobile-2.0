// PrivacyPolicyScreen - Privacy Policy
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, RADIUS } from '../theme';

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.date}>Last Updated: January 12, 2025</Text>

        <Text style={styles.intro}>
          Carben Connect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Account Information:</Text> When you create an account, we collect your name, email address, phone number, and company information.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Project Data:</Text> Information about your construction projects, including descriptions, photos, estimates, and related communications.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Voice Recordings:</Text> When you use our voice recording feature, we temporarily process audio recordings to transcribe and generate project details. These recordings are not permanently stored.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>QuickBooks Integration:</Text> If you connect QuickBooks, we access customer and invoice data necessary to synchronize your project information.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:
        </Text>
        <Text style={styles.bullet}>• Provide and maintain our services</Text>
        <Text style={styles.bullet}>• Process and manage your construction projects</Text>
        <Text style={styles.bullet}>• Enable communication between contractors and clients</Text>
        <Text style={styles.bullet}>• Synchronize data with QuickBooks</Text>
        <Text style={styles.bullet}>• Generate AI-assisted project descriptions and estimates</Text>
        <Text style={styles.bullet}>• Improve our services and develop new features</Text>
        <Text style={styles.bullet}>• Send you important service updates and notifications</Text>

        <Text style={styles.sectionTitle}>3. Data Storage and Security</Text>
        <Text style={styles.paragraph}>
          Your data is stored securely using Google Firebase and Google Cloud Storage. We implement industry-standard security measures including:
        </Text>
        <Text style={styles.bullet}>• Encrypted data transmission (SSL/TLS)</Text>
        <Text style={styles.bullet}>• Secure authentication and access controls</Text>
        <Text style={styles.bullet}>• Regular security audits and updates</Text>
        <Text style={styles.bullet}>• Limited employee access to personal data</Text>

        <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We use the following third-party services:
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Firebase/Google Cloud:</Text> Data storage and authentication</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>OpenAI:</Text> Voice transcription and AI text generation</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>QuickBooks:</Text> Accounting integration (when authorized)</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Vercel:</Text> Application hosting and API services</Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We share data only:
        </Text>
        <Text style={styles.bullet}>• With authorized contractors and clients for project collaboration</Text>
        <Text style={styles.bullet}>• With third-party service providers necessary for our operations</Text>
        <Text style={styles.bullet}>• When required by law or to protect our rights</Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bullet}>• Access your personal data</Text>
        <Text style={styles.bullet}>• Request correction of inaccurate data</Text>
        <Text style={styles.bullet}>• Request deletion of your data</Text>
        <Text style={styles.bullet}>• Opt-out of non-essential communications</Text>
        <Text style={styles.bullet}>• Export your project data</Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your data for as long as your account is active or as needed to provide services. Project data may be retained for business and legal purposes even after account closure.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy periodically. We will notify you of significant changes through the app or via email.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.paragraph}>
          Email: support@carbenconnect.com{'\n'}
          Website: www.carbenconnect.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  date: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  intro: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  bullet: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.md,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
  },
});
