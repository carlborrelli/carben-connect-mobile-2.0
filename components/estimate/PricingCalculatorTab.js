import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../theme';

export default function PricingCalculatorTab({ projectId, estimateProgress }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { user } = useAuth();
  const [calculator, setCalculator] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [taxRate, setTaxRate] = useState('8.5');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real-time listener for calculator data
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'estimateCalculators', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCalculator(data);
          setLineItems(data.lineItems || []);
          setTaxRate(String(data.taxRate || 8.5));
        } else {
          // Initialize with empty line items
          setLineItems([createEmptyLineItem()]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching calculator:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const createEmptyLineItem = () => ({
    id: Date.now().toString() + Math.random(),
    description: '',
    quantity: '',
    rate: '',
    amount: 0,
  });

  const addLineItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLineItems([...lineItems, createEmptyLineItem()]);
  };

  const removeLineItem = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // Calculate amount if quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
        const rate = parseFloat(field === 'rate' ? value : item.rate) || 0;
        updated.amount = qty * rate;
      }

      return updated;
    }));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRateNum = parseFloat(taxRate) || 0;
    const taxAmount = (subtotal * taxRateNum) / 100;
    const grandTotal = subtotal + taxAmount;

    return { subtotal, taxAmount, grandTotal };
  };

  const handleSave = async () => {
    // Validate line items
    const validItems = lineItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      Alert.alert('Input Required', 'Please add at least one line item');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const { subtotal, taxAmount, grandTotal } = calculateTotals();

      await setDoc(doc(db, 'estimateCalculators', projectId), {
        lineItems: validItems,
        subtotal,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        grandTotal,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      await setDoc(doc(db, 'estimateProgress', projectId), {
        calculatorStarted: true,
        calculatorComplete: grandTotal > 0,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user.uid,
      }, { merge: true });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Calculator saved successfully!');
    } catch (error) {
      console.error('Error saving calculator:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save calculator');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const { subtotal, taxAmount, grandTotal } = calculateTotals();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Line Items */}
        <Text style={styles.sectionLabel}>LINE ITEMS</Text>
        {lineItems.map((item, index) => (
          <View key={item.id} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemNumber}>#{index + 1}</Text>
              {lineItems.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeLineItem(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.red} />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Description (e.g., Materials, Labor)"
              placeholderTextColor={colors.tertiaryLabel}
              value={item.description}
              onChangeText={(text) => updateLineItem(item.id, 'description', text)}
            />

            <View style={styles.lineItemRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="0"
                  placeholderTextColor={colors.tertiaryLabel}
                  keyboardType="decimal-pad"
                  value={item.quantity}
                  onChangeText={(text) => updateLineItem(item.id, 'quantity', text)}
                />
              </View>

              <Text style={styles.multiplier}>×</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rate ($)</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.tertiaryLabel}
                  keyboardType="decimal-pad"
                  value={item.rate}
                  onChangeText={(text) => updateLineItem(item.id, 'rate', text)}
                />
              </View>

              <Text style={styles.equals}>=</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.amountDisplay}>
                  <Text style={styles.amountText}>
                    ${item.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Add Line Item Button */}
        <TouchableOpacity style={styles.addButton} onPress={addLineItem}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Line Item</Text>
        </TouchableOpacity>

        {/* Tax Rate */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>TAX</Text>
        <View style={styles.taxContainer}>
          <Text style={styles.taxLabel}>Tax Rate (%)</Text>
          <TextInput
            style={styles.taxInput}
            placeholder="8.5"
            placeholderTextColor={colors.tertiaryLabel}
            keyboardType="decimal-pad"
            value={taxRate}
            onChangeText={setTaxRate}
          />
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
            <Text style={styles.totalValue}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>${grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.systemBackground} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.systemBackground} />
              <Text style={styles.saveButtonText}>Save Calculator</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: SPACING.lg }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: colors.secondaryLabel,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  lineItem: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lineItemNumber: {
    ...TYPOGRAPHY.footnote,
    fontWeight: '700',
    color: colors.primary,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption2,
    color: colors.secondaryLabel,
    marginBottom: 4,
  },
  smallInput: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.separator,
    textAlign: 'center',
  },
  multiplier: {
    ...TYPOGRAPHY.headline,
    color: colors.tertiaryLabel,
    marginBottom: SPACING.sm,
  },
  equals: {
    ...TYPOGRAPHY.headline,
    color: colors.tertiaryLabel,
    marginBottom: SPACING.sm,
  },
  amountDisplay: {
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  amountText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    marginTop: SPACING.xs,
  },
  addButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.primary,
  },
  taxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  taxLabel: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  taxInput: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: colors.label,
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: colors.separator,
    minWidth: 80,
    textAlign: 'center',
  },
  totalsCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: colors.secondaryLabel,
  },
  totalValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: colors.label,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: colors.separator,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  grandTotalLabel: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...TYPOGRAPHY.headline,
    color: colors.systemBackground,
  },
});
