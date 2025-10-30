import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme';

const API_BASE_URL = 'https://www.carbenconnect.com/api';

export default function SendToQuickBooksTab({ projectId, project, estimateProgress }) {
  const { user } = useAuth();
  const [description, setDescription] = useState(null);
  const [calculator, setCalculator] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [qbCustomers, setQbCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [assigningCustomer, setAssigningCustomer] = useState(false);

  // Real-time listeners
  useEffect(() => {
    const unsubscribeDesc = onSnapshot(
      doc(db, 'estimateDescriptions', projectId),
      (docSnap) => setDescription(docSnap.exists() ? docSnap.data() : null)
    );

    const unsubscribeCalc = onSnapshot(
      doc(db, 'estimateCalculators', projectId),
      (docSnap) => setCalculator(docSnap.exists() ? docSnap.data() : null)
    );

    const unsubscribeEst = onSnapshot(
      doc(db, 'estimates', projectId),
      (docSnap) => {
        setEstimate(docSnap.exists() ? docSnap.data() : null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeDesc();
      unsubscribeCalc();
      unsubscribeEst();
    };
  }, [projectId]);

  // Fetch QB customers when needed
  const fetchQBCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quickbooks/customers`);

      if (!response.ok) {
        throw new Error('Failed to fetch QB customers');
      }

      const data = await response.json();
      setQbCustomers(data.customers || []);
      setShowCustomerPicker(true);
    } catch (error) {
      console.error('Error fetching QB customers:', error);
      Alert.alert(
        'Error',
        'Failed to load QuickBooks customers. Please ensure QuickBooks is connected.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAssignCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchQBCustomers();
  };

  const selectCustomer = async (customer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAssigningCustomer(true);

    try {
      await setDoc(doc(db, 'projects', projectId), {
        qbCustomerId: customer.Id,
        qbCustomerName: customer.DisplayName || customer.FullyQualifiedName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setShowCustomerPicker(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'QuickBooks customer assigned!');
    } catch (error) {
      console.error('Error assigning customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to assign customer');
    } finally {
      setAssigningCustomer(false);
    }
  };

  // Pre-flight checklist
  const getChecklist = () => [
    {
      id: 'description',
      label: 'Estimate description finalized',
      passed: description?.isFinalized && description?.finalizedText?.length > 0,
    },
    {
      id: 'calculator',
      label: 'Pricing calculator complete',
      passed: calculator?.grandTotal > 0,
    },
    {
      id: 'project',
      label: 'Project has valid client',
      passed: !!project?.clientId,
    },
    {
      id: 'qbCustomer',
      label: 'QuickBooks customer assigned',
      passed: !!project?.qbCustomerId,
    },
  ];

  const isReadyToSend = () => {
    const checklist = getChecklist();
    return checklist.every(item => item.passed);
  };

  const handleSendToQuickBooks = async () => {
    if (!isReadyToSend()) {
      Alert.alert(
        'Not Ready',
        'Please complete all checklist items before sending to QuickBooks.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Confirm before sending
    Alert.alert(
      'Send to QuickBooks',
      'Are you ready to send this estimate to QuickBooks?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setSending(true);

            try {
              const payload = {
                projectId,
                grandTotal: calculator.grandTotal,
                qbCustomerId: project.qbCustomerId,
                qbCustomerName: project.qbCustomerName,
                estimateNumber: calculator.estimateNumber || null,
                description: description.finalizedText,
                calculator: calculator,
              };

              console.log('Sending to QuickBooks:', payload);

              const response = await fetch(`${API_BASE_URL}/quickbooks/create-estimate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || 'Failed to create estimate in QuickBooks');
              }

              console.log('QuickBooks estimate created:', result);

              // Update estimate progress in Firestore
              await updateDoc(doc(db, 'estimateProgress', projectId), {
                sentToQuickBooks: true,
                lastEditedAt: serverTimestamp(),
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert(
                'Success!',
                'Estimate has been sent to QuickBooks successfully.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error sending to QuickBooks:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

              Alert.alert(
                'Error',
                error.message || 'Failed to send estimate to QuickBooks. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const checklist = getChecklist();
  const allPassed = isReadyToSend();
  const alreadySent = estimateProgress?.sentToQuickBooks || !!estimate;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {alreadySent && (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
            <Text style={styles.statusText}>Sent to QuickBooks</Text>
          </View>
        )}

        {/* Pre-flight Checklist */}
        <Text style={styles.sectionLabel}>PRE-FLIGHT CHECKLIST</Text>
        <View style={styles.checklistCard}>
          {checklist.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <View style={[
                styles.checkIcon,
                item.passed && styles.checkIconPassed
              ]}>
                <Ionicons
                  name={item.passed ? 'checkmark' : 'close'}
                  size={16}
                  color={item.passed ? COLORS.green : COLORS.red}
                />
              </View>
              <Text style={[
                styles.checklistLabel,
                item.passed && styles.checklistLabelPassed
              ]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Customer Assignment */}
        <Text style={styles.sectionLabel}>QUICKBOOKS CUSTOMER</Text>

        {!project?.qbCustomerId ? (
          <TouchableOpacity
            style={styles.assignCustomerButton}
            onPress={handleAssignCustomer}
            activeOpacity={0.7}
            disabled={loadingCustomers}
          >
            <View style={styles.assignCustomerContent}>
              {loadingCustomers ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="person-add-outline" size={24} color={COLORS.primary} />
              )}
              <View style={styles.assignCustomerText}>
                <Text style={styles.assignCustomerTitle}>
                  {loadingCustomers ? 'Loading Customers...' : 'Assign Customer'}
                </Text>
                <Text style={styles.assignCustomerSubtitle}>
                  Select a QuickBooks customer for this estimate
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray3} />
          </TouchableOpacity>
        ) : (
          <View style={styles.currentCustomer}>
            <View style={styles.currentCustomerHeader}>
              <Ionicons name="person-circle" size={28} color={COLORS.green} />
              <View style={styles.currentCustomerInfo}>
                <Text style={styles.currentCustomerLabel}>Assigned Customer</Text>
                <Text style={styles.currentCustomerName}>{project.qbCustomerName}</Text>
              </View>
              <TouchableOpacity onPress={handleAssignCustomer}>
                <Ionicons name="create-outline" size={20} color={COLORS.blue} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Estimate Summary */}
        {calculator && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>ESTIMATE SUMMARY</Text>
            <View style={styles.summaryCard}>
              {calculator.estimateNumber && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimate Number</Text>
                  <Text style={styles.summaryValue}>{calculator.estimateNumber}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  ${calculator.subtotal?.toFixed(2) || '0.00'}
                </Text>
              </View>
              {calculator.taxRate > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Tax ({calculator.taxRate}%)
                  </Text>
                  <Text style={styles.summaryValue}>
                    ${calculator.taxAmount?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={styles.summaryLabelTotal}>Grand Total</Text>
                <Text style={styles.summaryValueTotal}>
                  ${calculator.grandTotal?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!allPassed && !alreadySent && (
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.secondaryLabel} />
            <Text style={styles.helpText}>
              Complete all checklist items above to enable sending to QuickBooks
            </Text>
          </View>
        )}

        {/* Send Button */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!allPassed || sending) && styles.buttonDisabled
        ]}
        onPress={handleSendToQuickBooks}
        disabled={!allPassed || sending}
        activeOpacity={0.8}
      >
        {sending ? (
          <>
            <ActivityIndicator size="small" color={COLORS.systemBackground} />
            <Text style={styles.sendButtonText}>Sending...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={24} color={COLORS.systemBackground} />
            <Text style={styles.sendButtonText}>
              {alreadySent ? 'Update in QuickBooks' : 'Send to QuickBooks'}
            </Text>
          </>
        )}
      </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      {/* Customer Picker Modal */}
      <Modal
        visible={showCustomerPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.customerList}>
            {qbCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.Id}
                style={styles.customerItem}
                onPress={() => selectCustomer(customer)}
                disabled={assigningCustomer}
              >
                <View style={styles.customerIcon}>
                  <Ionicons name="business" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {customer.DisplayName || customer.FullyQualifiedName}
                  </Text>
                  {customer.CompanyName && customer.CompanyName !== customer.DisplayName && (
                    <Text style={styles.customerCompany}>{customer.CompanyName}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.tertiaryLabel} />
              </TouchableOpacity>
            ))}

            {qbCustomers.length === 0 && (
              <View style={styles.emptyCustomers}>
                <Ionicons name="people-outline" size={48} color={COLORS.tertiaryLabel} />
                <Text style={styles.emptyText}>No QuickBooks customers found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
    marginBottom: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: COLORS.green,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: COLORS.secondaryLabel,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },
  checklistCard: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconPassed: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  checklistLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  checklistLabelPassed: {
    color: COLORS.label,
  },
  assignCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.systemBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  assignCustomerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  assignCustomerText: {
    flex: 1,
  },
  assignCustomerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
  },
  assignCustomerSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  currentCustomer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  currentCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  currentCustomerInfo: {
    flex: 1,
  },
  currentCustomerLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginBottom: 2,
  },
  currentCustomerName: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    fontWeight: '600',
  },
  summarySection: {
    marginTop: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  summaryRowTotal: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondaryLabel,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    fontWeight: '500',
  },
  summaryLabelTotal: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    fontWeight: '700',
  },
  summaryValueTotal: {
    ...TYPOGRAPHY.title3,
    color: COLORS.primary,
    fontWeight: '700',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
  },
  helpText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    flex: 1,
    lineHeight: 16,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...TYPOGRAPHY.headline,
    color: COLORS.systemBackground,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
    backgroundColor: COLORS.systemBackground,
  },
  modalCancel: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    width: 60,
  },
  modalTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.label,
    fontWeight: '600',
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body,
    color: COLORS.label,
    fontWeight: '600',
  },
  customerCompany: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  emptyCustomers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.tertiaryLabel,
    marginTop: SPACING.sm,
  },
});
