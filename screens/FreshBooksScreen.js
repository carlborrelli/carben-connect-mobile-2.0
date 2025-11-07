// FreshBooksScreen - FreshBooks import and integration (Admin only)
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

export default function FreshBooksScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { userProfile, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [tokenExpiry, setTokenExpiry] = useState(null);
  
  // Invoice fetching
  const [fetchingInvoices, setFetchingInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Import state
  const [importing, setImporting] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [clientSelections, setClientSelections] = useState({});
  
  // Client modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [currentInvoiceForClient, setCurrentInvoiceForClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Location modal (for clients with multiple locations)
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedClientForLocation, setSelectedClientForLocation] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'This feature is only available to administrators.');
      navigation.goBack();
    }
  }, [isAdmin]);

  // Load connection status
  useEffect(() => {
    loadConnectionStatus();
    loadClients();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'freshbooks'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const isConnected = data.accessToken && data.connected;
        setConnected(isConnected);
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        setTokenExpiry(data.tokenExpiry);
      }
    } catch (error) {
      console.error('Error loading FreshBooks status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientsList = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsList);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const connectFunction = httpsCallable(functions, 'freshbooksConnect');
      const result = await connectFunction({
        redirectUri: 'https://us-central1-carben-connect.cloudfunctions.net/freshbooksCallback'
      });

      if (result.data.success && result.data.authUrl) {
        Alert.alert(
          'Connect FreshBooks',
          'You will be redirected to FreshBooks to authorize the connection. After authorizing, close the browser and return to the app to refresh the connection status.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                const supported = await Linking.canOpenURL(result.data.authUrl);
                if (supported) {
                  await Linking.openURL(result.data.authUrl);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                  Alert.alert('Error', 'Cannot open the authorization URL');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error connecting FreshBooks:', error);
      Alert.alert('Error', 'Failed to initialize FreshBooks connection');
    }
  };

  const handleDisconnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Disconnect FreshBooks',
      'Are you sure you want to disconnect FreshBooks? You will need to reconnect to import more invoices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const disconnectFunction = httpsCallable(functions, 'freshbooksDisconnect');
              const result = await disconnectFunction();
              
              if (result.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setConnected(false);
                setConnectionStatus('disconnected');
                setInvoices([]);
                Alert.alert('Success', 'FreshBooks disconnected successfully');
              }
            } catch (error) {
              console.error('Error disconnecting FreshBooks:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to disconnect FreshBooks');
            }
          }
        }
      ]
    );
  };

  const handleFetchInvoices = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFetchingInvoices(true);
    
    try {
      const getInvoicesFunction = httpsCallable(functions, 'freshbooksGetInvoices');
      const result = await getInvoicesFunction({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        perPage: 50
      });

      if (result.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setInvoices(result.data.invoices);
        setTotalPages(result.data.pagination.pages);
        
        if (result.data.invoices.length === 0) {
          Alert.alert('No Invoices', 'No invoices found for the selected date range.');
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to fetch invoices from FreshBooks');
    } finally {
      setFetchingInvoices(false);
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
      // Remove client selection when deselecting
      const newClientSelections = { ...clientSelections };
      delete newClientSelections[invoiceId];
      setClientSelections(newClientSelections);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSelectClient = (invoiceId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInvoiceForClient(invoiceId);
    setShowClientModal(true);
  };

  const handleClientSelected = (client) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If client has multiple locations, show location picker
    if (client.qbCustomers && client.qbCustomers.length > 1) {
      setSelectedClientForLocation(client);
      setShowClientModal(false);
      setShowLocationModal(true);
    } else {
      // Client has no locations or only 1 location - proceed directly
      setClientSelections({
        ...clientSelections,
        [currentInvoiceForClient]: client
      });
      setShowClientModal(false);
      setCurrentInvoiceForClient(null);
    }
  };

  const handleLocationSelected = (location) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Store both client and location info
    setClientSelections({
      ...clientSelections,
      [currentInvoiceForClient]: {
        ...selectedClientForLocation,
        selectedLocation: location
      }
    });

    setShowLocationModal(false);
    setSelectedClientForLocation(null);
    setCurrentInvoiceForClient(null);
  };

  const handleImportSelected = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate all selected invoices have clients assigned
    const unassigned = Array.from(selectedInvoices).filter(id => !clientSelections[id]);
    if (unassigned.length > 0) {
      Alert.alert(
        'Client Required',
        `Please assign a client to all selected invoices before importing. ${unassigned.length} invoice(s) missing client assignment.`
      );
      return;
    }

    Alert.alert(
      'Import Invoices',
      `Import ${selectedInvoices.size} invoice(s) as projects and estimates?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImporting(true);
            try {
              const bulkImportFunction = httpsCallable(functions, 'freshbooksBulkImport');

              const invoicesToImport = Array.from(selectedInvoices).map(invoiceId => {
                const clientData = clientSelections[invoiceId];
                const invoiceData = {
                  invoiceId: invoiceId,
                  clientId: clientData.id
                };

                // Include location data if available
                if (clientData.selectedLocation) {
                  invoiceData.locationId = clientData.selectedLocation.id;
                  invoiceData.locationName = clientData.selectedLocation.name;
                }

                return invoiceData;
              });

              const result = await bulkImportFunction({
                invoices: invoicesToImport,
                createEstimates: true
              });

              if (result.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Import Complete',
                  `Successfully imported ${result.data.imported} invoice(s).` +
                  (result.data.failed > 0 ? `\n${result.data.failed} failed.` : ''),
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Clear selections
                        setSelectedInvoices(new Set());
                        setClientSelections({});
                        // Refresh invoice list
                        handleFetchInvoices();
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Error importing invoices:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message || 'Failed to import invoices');
            } finally {
              setImporting(false);
            }
          }
        }
      ]
    );
  };

  const handleClearImported = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Clear Imported Data',
      'This will DELETE all projects and estimates imported from FreshBooks. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const clearFunction = httpsCallable(functions, 'freshbooksClearImported');
              const result = await clearFunction();
              
              if (result.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', result.data.message);
              }
            } catch (error) {
              console.error('Error clearing imported data:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to clear imported data');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const renderInvoiceItem = ({ item }) => {
    const isSelected = selectedInvoices.has(item.id);
    const client = clientSelections[item.id];

    return (
      <View style={styles.invoiceCard}>
        <TouchableOpacity
          style={styles.invoiceHeader}
          onPress={() => handleSelectInvoice(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.invoiceCheckbox}>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? colors.primary : colors.tertiaryLabel}
            />
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.invoiceCustomer}>{item.organization || item.customerName}</Text>
            <Text style={styles.invoiceDate}>{formatDate(item.date)}</Text>
          </View>
          <Text style={styles.invoiceAmount}>{formatCurrency(item.amount)}</Text>
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.clientSelector}>
            {client ? (
              <TouchableOpacity
                style={styles.clientSelectedButton}
                onPress={() => handleSelectClient(item.id)}
              >
                <Ionicons name="person" size={16} color={colors.systemBackground} />
                <View style={styles.clientSelectedInfo}>
                  <Text style={styles.clientSelectedText}>{client.name}</Text>
                  {client.selectedLocation && (
                    <Text style={styles.locationSelectedText}>
                      <Ionicons name="location" size={12} color={colors.systemBackground} />
                      {' '}{client.selectedLocation.name}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.systemBackground} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.clientSelectButton}
                onPress={() => handleSelectClient(item.id)}
              >
                <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                <Text style={styles.clientSelectText}>Select Client</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FreshBooks</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FreshBooks</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={connected ? 'cloud-done' : 'cloud-offline'}
                size={24}
                color={connected ? colors.green : colors.secondaryLabel}
              />
              <Text style={styles.statusText}>
                {connected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
            {connected ? (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnect}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {connected && (
          <>
            {/* Date Range Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.fetchButton}
                onPress={handleFetchInvoices}
                disabled={fetchingInvoices}
              >
                {fetchingInvoices ? (
                  <ActivityIndicator size="small" color={colors.systemBackground} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color={colors.systemBackground} />
                    <Text style={styles.fetchButtonText}>Fetch Invoices</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Invoice List */}
            {invoices.length > 0 && (
              <View style={styles.section}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.sectionTitle}>
                    Invoices ({invoices.length})
                  </Text>
                  {selectedInvoices.size > 0 && (
                    <Text style={styles.selectedCount}>
                      {selectedInvoices.size} selected
                    </Text>
                  )}
                </View>
                
                <FlatList
                  data={invoices}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderInvoiceItem}
                  scrollEnabled={false}
                />

                {/* Import Actions */}
                {selectedInvoices.size > 0 && (
                  <View style={styles.importActions}>
                    <TouchableOpacity
                      style={styles.importButton}
                      onPress={handleImportSelected}
                      disabled={importing}
                    >
                      {importing ? (
                        <ActivityIndicator size="small" color={colors.systemBackground} />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color={colors.systemBackground} />
                          <Text style={styles.importButtonText}>
                            Import Selected
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Danger Zone */}
            <View style={styles.section}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearImported}
              >
                <Ionicons name="trash-outline" size={20} color={colors.systemBackground} />
                <Text style={styles.dangerButtonText}>Clear All Imported Data</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Client Selection Modal */}
      <Modal
        visible={showClientModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity
                onPress={() => setShowClientModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.label} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientItem}
                  onPress={() => handleClientSelected(client)}
                >
                  <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                  <View style={styles.clientItemInfo}>
                    <Text style={styles.clientItemName}>{client.name}</Text>
                    {client.email && (
                      <Text style={styles.clientItemEmail}>{client.email}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLocationModal(false);
                  setSelectedClientForLocation(null);
                  setCurrentInvoiceForClient(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.label} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedClientForLocation?.qbCustomers?.map((location, index) => (
                <TouchableOpacity
                  key={location.id || index}
                  style={styles.locationItem}
                  onPress={() => handleLocationSelected(location)}
                >
                  <Ionicons name="location" size={32} color={colors.primary} />
                  <View style={styles.locationItemInfo}>
                    <Text style={styles.locationItemName}>{location.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
    marginBottom: SPACING.md,
  },
  statusCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statusText: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
  },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  connectButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: colors.secondarySystemBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  disconnectButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginBottom: SPACING.xs,
  },
  dateInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: colors.label,
  },
  fetchButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  fetchButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  selectedCount: {
    ...TYPOGRAPHY.caption1,
    color: colors.primary,
    fontWeight: '600',
  },
  invoiceCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  invoiceHeader: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  invoiceCheckbox: {
    marginRight: SPACING.md,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
  invoiceCustomer: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  invoiceDate: {
    ...TYPOGRAPHY.caption2,
    color: colors.tertiaryLabel,
    marginTop: SPACING.xs / 2,
  },
  invoiceAmount: {
    ...TYPOGRAPHY.title3,
    color: colors.primary,
    fontWeight: '600',
  },
  clientSelector: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    padding: SPACING.md,
  },
  clientSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.systemBackground,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clientSelectText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.primary,
    fontWeight: '600',
  },
  clientSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.green,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  clientSelectedText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  importActions: {
    marginTop: SPACING.md,
  },
  importButton: {
    backgroundColor: colors.green,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  importButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  dangerTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.red,
    marginBottom: SPACING.md,
  },
  dangerButton: {
    backgroundColor: colors.red,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dangerButtonText: {
    ...TYPOGRAPHY.subheadline,
    color: colors.systemBackground,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.systemGroupedBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  modalTitle: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  clientItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  clientItemName: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
  clientItemEmail: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    marginTop: SPACING.xs / 2,
  },
  clientSelectedInfo: {
    flex: 1,
    marginLeft: SPACING.xs,
  },
  locationSelectedText: {
    ...TYPOGRAPHY.caption1,
    color: colors.systemBackground,
    marginTop: SPACING.xs / 2,
    opacity: 0.9,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  locationItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  locationItemName: {
    ...TYPOGRAPHY.subheadline,
    color: colors.label,
    fontWeight: '600',
  },
});
