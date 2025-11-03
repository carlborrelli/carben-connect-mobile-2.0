import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const createEmptyLineItem = () => ({
  id: Date.now().toString() + Math.random(),
  item: '',
  qty: '1',
  unitCost: '',
  total: 0,
});

const createEmptyLaborItem = () => ({
  id: Date.now().toString() + Math.random(),
  days: '1',
  rate: '4000',
  total: 4000,
});

const LABOR_RATES = [
  { label: '$4,000', value: '4000' },
  { label: '$3,000', value: '3000' },
  { label: '$2,500', value: '2500' },
  { label: '$2,000', value: '2000' },
  { label: 'Custom', value: 'custom' },
];

// Standard section (Materials, Subcontractors)
const CalculatorSection = ({
  title,
  items,
  onItemsChange,
  isExpanded,
  onToggle,
  markup,
  onMarkupChange,
  colors,
  styles,
}) => {
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const markupPercent = parseFloat(markup) || 0;
    return subtotal + (subtotal * markupPercent / 100);
  };

  const addRow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onItemsChange([...items, createEmptyLineItem()]);
  };

  const removeRow = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (items.length === 1) {
      Alert.alert('Cannot Remove', 'At least one row is required');
      return;
    }
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    onItemsChange(items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'qty' || field === 'unitCost') {
        const qty = parseFloat(field === 'qty' ? value : item.qty) || 0;
        const unitCost = parseFloat(field === 'unitCost' ? value : item.unitCost) || 0;
        updated.total = qty * unitCost;
      }

      return updated;
    }));
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionHeaderRight}>
          <Text style={styles.sectionTotal}>${total.toFixed(2)}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray2}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
            <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>QTY</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.75 }]}>Cost</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.75 }]}>Total</Text>
            <View style={{ width: 32 }} />
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <TextInput
                style={[styles.tableInput, { flex: 2 }]}
                value={item.item}
                onChangeText={(text) => updateItem(item.id, 'item', text)}
                placeholder="Item name"
                placeholderTextColor={colors.quaternaryLabel}
                multiline={true}
              />
              <TextInput
                style={[styles.tableInput, { flex: 0.5 }]}
                value={item.qty}
                onChangeText={(text) => updateItem(item.id, 'qty', text)}
                placeholder="1"
                placeholderTextColor={colors.quaternaryLabel}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.tableInput, { flex: 1.75 }]}
                value={item.unitCost}
                onChangeText={(text) => updateItem(item.id, 'unitCost', text)}
                placeholder="0.00"
                placeholderTextColor={colors.quaternaryLabel}
                keyboardType="decimal-pad"
              />
              <View style={[styles.totalCell, { flex: 1.75 }]}>
                <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeRow(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addRowButton} onPress={addRow}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addRowText}>Add Row</Text>
          </TouchableOpacity>

          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Markup</Text>
              <View style={styles.markupInputContainer}>
                <TextInput
                  style={styles.markupInput}
                  value={markup}
                  onChangeText={onMarkupChange}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.markupPercent}>%</Text>
              </View>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Labor section (simplified - single row only)
const LaborSection = ({
  items,
  onItemsChange,
  isExpanded,
  onToggle,
  colors,
  styles,
}) => {
  const [showRatePicker, setShowRatePicker] = useState(false);
  const [customRate, setCustomRate] = useState('');

  // Ensure we only have one labor item
  const laborItem = items[0] || { id: '1', days: '1', rate: '4000', total: 4000 };

  const updateLabor = (field, value) => {
    const updated = { ...laborItem, [field]: value };

    if (field === 'days' || field === 'rate') {
      const days = parseFloat(field === 'days' ? value : laborItem.days) || 0;
      const rate = parseFloat(field === 'rate' ? value : laborItem.rate) || 0;
      updated.total = days * rate;
    }

    onItemsChange([updated]);
  };

  const selectRate = (rate) => {
    if (rate === 'custom') {
      // Keep picker open for custom input
    } else {
      updateLabor('rate', rate);
      setShowRatePicker(false);
    }
  };

  const applyCustomRate = () => {
    const rateValue = parseFloat(customRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate');
      return;
    }
    updateLabor('rate', customRate);
    setShowRatePicker(false);
    setCustomRate('');
  };

  const selectedRate = LABOR_RATES.find(r => r.value === laborItem.rate);
  const displayRate = selectedRate ? selectedRate.label : `$${laborItem.rate}`;
  const total = laborItem.total || 0;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>Labor</Text>
        <View style={styles.sectionHeaderRight}>
          <Text style={styles.sectionTotal}>${total.toFixed(2)}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.gray2}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          <View style={styles.laborRow}>
            <View style={styles.laborColumn}>
              <Text style={styles.laborLabel}>Rate</Text>
              <TouchableOpacity
                style={styles.laborRateSelector}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowRatePicker(true);
                }}
              >
                <Text style={styles.laborRateSelectorText}>{displayRate}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray2} />
              </TouchableOpacity>
            </View>

            <View style={styles.laborColumn}>
              <Text style={styles.laborLabel}>Days</Text>
              <TextInput
                style={styles.laborInput}
                value={laborItem.days}
                onChangeText={(text) => updateLabor('days', text)}
                placeholder="1"
                placeholderTextColor={colors.quaternaryLabel}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.laborColumn}>
              <Text style={styles.laborLabel}>Total</Text>
              <View style={styles.laborTotalDisplay}>
                <Text style={styles.laborTotalText}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Rate Picker Modal */}
      <Modal
        visible={showRatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRatePicker(false)}
        >
          <View style={styles.ratePickerModal}>
            <Text style={styles.ratePickerTitle}>Select Rate</Text>
            {LABOR_RATES.map((rate) => (
              <TouchableOpacity
                key={rate.value}
                style={styles.rateOption}
                onPress={() => selectRate(rate.value)}
              >
                <Text style={styles.rateOptionText}>{rate.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.customRateInput}>
              <TextInput
                style={styles.customRateField}
                value={customRate}
                onChangeText={setCustomRate}
                placeholder="Enter custom rate"
                placeholderTextColor={colors.quaternaryLabel}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyCustomRate}
              >
                <Text style={styles.applyButtonText}>Apply Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function CalculatorTab({ projectId }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useAuth();
  const [materials, setMaterials] = useState([createEmptyLineItem()]);
  const [materialsMarkup, setMaterialsMarkup] = useState('30');
  const [subcontractors, setSubcontractors] = useState([createEmptyLineItem()]);
  const [subcontractorsMarkup, setSubcontractorsMarkup] = useState('30');
  const [labor, setLabor] = useState([createEmptyLaborItem()]);
  const [profitType, setProfitType] = useState('percent'); // 'percent' or 'dollar'
  const [profitValue, setProfitValue] = useState('0');
  const [expandedSections, setExpandedSections] = useState({
    materials: true,
    subcontractors: false,
    labor: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'estimateCalculators', projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMaterials(data.materials || [createEmptyLineItem()]);
          setMaterialsMarkup(String(data.materialsMarkup || 30));
          setSubcontractors(data.subcontractors || [createEmptyLineItem()]);
          setSubcontractorsMarkup(String(data.subcontractorsMarkup || 30));
          setLabor(data.labor || [createEmptyLaborItem()]);
          setProfitType(data.profitType || 'percent');
          setProfitValue(String(data.profitValue !== undefined ? data.profitValue : 0));
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

  // Auto-save effect with debounce
  useEffect(() => {
    if (loading) return; // Don't auto-save during initial load

    const timer = setTimeout(() => {
      handleSave(true); // Pass true to indicate auto-save (no alert)
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(timer);
  }, [materials, materialsMarkup, subcontractors, subcontractorsMarkup, labor, profitType, profitValue]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateSectionTotal = (items, markup) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const markupPercent = parseFloat(markup) || 0;
    return subtotal + (subtotal * markupPercent / 100);
  };

  const calculateLaborTotal = () => {
    return labor.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateGrandTotal = () => {
    const materialsTotal = calculateSectionTotal(materials, materialsMarkup);
    const subcontractorsTotal = calculateSectionTotal(subcontractors, subcontractorsMarkup);
    const laborTotal = calculateLaborTotal();
    const subtotal = materialsTotal + subcontractorsTotal + laborTotal;

    let profit = 0;
    if (profitType === 'percent') {
      profit = subtotal * (parseFloat(profitValue) || 0) / 100;
    } else {
      profit = parseFloat(profitValue) || 0;
    }

    return subtotal + profit;
  };

  const handleSave = async (isAutoSave = false) => {
    if (!isAutoSave) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSaving(true);

    try {
      const grandTotal = calculateGrandTotal();

      await setDoc(doc(db, 'estimateCalculators', projectId), {
        materials,
        materialsMarkup: parseFloat(materialsMarkup) || 0,
        subcontractors,
        subcontractorsMarkup: parseFloat(subcontractorsMarkup) || 0,
        labor,
        profitType,
        profitValue: parseFloat(profitValue) || 0,
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

      setLastSaved(new Date());

      if (!isAutoSave) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Calculator saved successfully!');
      }
    } catch (error) {
      console.error('Error saving calculator:', error);
      if (!isAutoSave) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to save calculator');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const materialsTotal = calculateSectionTotal(materials, materialsMarkup);
  const subcontractorsTotal = calculateSectionTotal(subcontractors, subcontractorsMarkup);
  const laborTotal = calculateLaborTotal();
  const subtotalAll = materialsTotal + subcontractorsTotal + laborTotal;

  let profitAmount = 0;
  if (profitType === 'percent') {
    profitAmount = subtotalAll * (parseFloat(profitValue) || 0) / 100;
  } else {
    profitAmount = parseFloat(profitValue) || 0;
  }

  const grandTotal = subtotalAll + profitAmount;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CalculatorSection
          title="Materials"
          items={materials}
          onItemsChange={setMaterials}
          isExpanded={expandedSections.materials}
          onToggle={() => toggleSection('materials')}
          markup={materialsMarkup}
          onMarkupChange={setMaterialsMarkup}
          colors={colors}
          styles={styles}
        />

        <CalculatorSection
          title="Subcontractors"
          items={subcontractors}
          onItemsChange={setSubcontractors}
          isExpanded={expandedSections.subcontractors}
          onToggle={() => toggleSection('subcontractors')}
          markup={subcontractorsMarkup}
          onMarkupChange={setSubcontractorsMarkup}
          colors={colors}
          styles={styles}
        />

        <LaborSection
          items={labor}
          onItemsChange={setLabor}
          isExpanded={expandedSections.labor}
          onToggle={() => toggleSection('labor')}
          colors={colors}
          styles={styles}
        />

        <View style={styles.profitSection}>
          <Text style={styles.profitTitle}>Profit</Text>
          <View style={styles.profitContent}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (All Sections)</Text>
              <Text style={styles.totalValue}>${subtotalAll.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Profit</Text>
              <View style={styles.profitInputContainer}>
                <TextInput
                  style={styles.markupInput}
                  value={profitValue}
                  onChangeText={setProfitValue}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.profitToggle}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setProfitType(profitType === 'percent' ? 'dollar' : 'percent');
                  }}
                >
                  <Text style={styles.profitToggleText}>
                    {profitType === 'percent' ? '%' : '$'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Profit Amount</Text>
              <Text style={styles.totalValue}>${profitAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>${grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.saveInfo}>
          {lastSaved && (
            <View style={styles.autoSaveIndicator}>
              <Ionicons name="checkmark-circle" size={14} color={colors.green} />
              <Text style={styles.autoSaveText}>
                Auto-saved {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.systemBackground} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.systemBackground} />
              <Text style={styles.saveButtonText}>Save Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  content: { padding: SPACING.md },
  section: { backgroundColor: colors.systemBackground, borderRadius: RADIUS.md, marginBottom: SPACING.sm, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  sectionTitle: { ...TYPOGRAPHY.headline, color: colors.label },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sectionTotal: { ...TYPOGRAPHY.headline, color: colors.primary, fontWeight: '700' },
  sectionContent: { padding: SPACING.md },
  tableHeader: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs },
  tableHeaderText: { ...TYPOGRAPHY.caption1, color: colors.secondaryLabel, fontWeight: '700' },
  tableRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs, alignItems: 'center' },
  tableInput: { ...TYPOGRAPHY.body, color: colors.label, backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.xs, borderWidth: 1, borderColor: colors.separator },
  totalCell: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.xs, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  totalText: { ...TYPOGRAPHY.footnote, color: colors.primary, fontWeight: '600' },
  removeButton: { width: 32, alignItems: 'center' },
  addRowButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, gap: SPACING.xs, marginTop: SPACING.xs, marginBottom: SPACING.md },
  addRowText: { ...TYPOGRAPHY.body, color: colors.primary },
  totalsContainer: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs },
  totalLabel: { ...TYPOGRAPHY.body, color: colors.secondaryLabel },
  totalValue: { ...TYPOGRAPHY.body, color: colors.label, fontWeight: '600' },
  markupInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markupInput: { ...TYPOGRAPHY.body, color: colors.label, backgroundColor: colors.systemBackground, borderRadius: RADIUS.sm, paddingVertical: 4, paddingHorizontal: SPACING.xs, borderWidth: 1, borderColor: colors.separator, minWidth: 50, textAlign: 'center', fontWeight: '600' },
  markupPercent: { ...TYPOGRAPHY.body, color: colors.secondaryLabel },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: colors.separator, marginTop: SPACING.xs, paddingTop: SPACING.sm },
  grandTotalLabel: { ...TYPOGRAPHY.headline, color: colors.label },
  grandTotalValue: { ...TYPOGRAPHY.headline, color: colors.primary, fontSize: 20, fontWeight: '700' },
  rateSelector: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.xs, borderWidth: 1, borderColor: colors.separator, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateSelectorText: { ...TYPOGRAPHY.body, color: colors.label },
  laborTotalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm, marginTop: SPACING.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ratePickerModal: { backgroundColor: colors.systemBackground, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '80%', maxWidth: 300 },
  ratePickerTitle: { ...TYPOGRAPHY.title3, color: colors.label, marginBottom: SPACING.md, textAlign: 'center' },
  rateOption: { paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  rateOptionText: { ...TYPOGRAPHY.body, color: colors.label, textAlign: 'center' },
  customRateInput: { marginTop: SPACING.md, gap: SPACING.sm },
  customRateField: { ...TYPOGRAPHY.body, color: colors.label, backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm, borderWidth: 1, borderColor: colors.separator },
  applyButton: { backgroundColor: colors.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  applyButtonText: { ...TYPOGRAPHY.headline, color: colors.systemBackground },
  profitSection: { backgroundColor: colors.systemBackground, borderRadius: RADIUS.md, padding: SPACING.md },
  profitTitle: { ...TYPOGRAPHY.headline, color: colors.label, marginBottom: SPACING.sm },
  profitContent: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm },
  profitInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profitToggle: { backgroundColor: colors.primary, paddingVertical: 4, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.sm, minWidth: 32, alignItems: 'center' },
  profitToggleText: { ...TYPOGRAPHY.body, color: colors.systemBackground, fontWeight: '700' },
  laborRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-end' },
  laborColumn: { flex: 1 },
  laborLabel: { ...TYPOGRAPHY.caption1, color: colors.secondaryLabel, fontWeight: '700', marginBottom: SPACING.xs },
  laborRateSelector: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm, borderWidth: 1, borderColor: colors.separator, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  laborRateSelectorText: { ...TYPOGRAPHY.body, color: colors.label },
  laborInput: { ...TYPOGRAPHY.body, color: colors.label, backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm, borderWidth: 1, borderColor: colors.separator, textAlign: 'center', minHeight: 44 },
  laborTotalDisplay: { backgroundColor: colors.secondarySystemGroupedBackground, borderRadius: RADIUS.sm, padding: SPACING.sm, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  laborTotalText: { ...TYPOGRAPHY.body, color: colors.primary, fontWeight: '700', fontSize: 16 },
  bottomBar: { backgroundColor: colors.systemBackground, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, padding: SPACING.md },
  saveInfo: { marginBottom: SPACING.xs },
  autoSaveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  autoSaveText: { ...TYPOGRAPHY.caption2, color: colors.secondaryLabel },
  saveButton: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md, gap: SPACING.sm },
  buttonDisabled: { opacity: 0.5 },
  saveButtonText: { ...TYPOGRAPHY.headline, color: colors.systemBackground },
});
