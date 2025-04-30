import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EstimatePreviewModal from './EstimatePreviewModal';
import { 
  getMaterialDescriptions, 
  MaterialDescription, 
  createEstimate, 
  downloadEstimatePreview,
  EstimateData as ApiEstimateData,
  EstimateItem as ApiEstimateItem
} from "@/ts/estimate";
import { getUserEmail, saveUserEmail } from '../utils/userStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

interface EstimateItem {
  quantity: string;
  description: string;
  unitPrice: string;
  amount: string;
  unit: string;
  index?: number;
  chosen_material_id?: number;
}

interface EstimateDisplayData {
  id: string;
  client: string;
  contactPerson?: string;
  email?: string;
  status: string;
  createdAt: string;
  items: {
    name: string;
    description: string;
    quantity: number;
    price: number;
    unit: string;
    chosen_material_id?: number;
  }[];
  notes: string;
  totalMaterials: string;
  workmanship: string;
  grandTotal: string;
}

interface CreateEstimateProps {
  onCreated: () => void;
}

const CreateEstimate: React.FC<CreateEstimateProps> = ({ onCreated }) => {
  // Client and estimate details
  const [clientName, setClientName] = useState("");
  const [estimateTitle, setEstimateTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [workmanshipPrice, setWorkmanshipPrice] = useState('');
  const [userEmail, setUserEmail] = useState<string>("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdEstimateId, setCreatedEstimateId] = useState<number | null>(null);
  
  // Items section state
  const [rows, setRows] = useState<EstimateItem[]>([{ 
    quantity: "", 
    description: "", 
    unitPrice: "", 
    amount: "", 
    unit: "pieces" 
  }]);
  const [editingItem, setEditingItem] = useState<EstimateItem>({
    quantity: "",
    description: "",
    unit: "pieces",
    unitPrice: "",
    amount: "",
    index: undefined,
    chosen_material_id: undefined
  });
  const [modalVisible, setModalVisible] = useState(false);

  const UNIT_OPTIONS = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'meters', label: 'Meters' },
    { value: 'yards', label: 'Yards' },
    { value: 'feet', label: 'Feet' },
    { value: 'coils', label: 'Coils' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'units', label: 'Units' },
    // Hardware additions
    { value: 'liters', label: 'Liters' },
    { value: 'gallons', label: 'Gallons' },
    { value: 'spools', label: 'Spools' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'pairs', label: 'Pairs' },
    { value: 'sets', label: 'Sets' },
    { value: 'packs', label: 'Packs' },
    { value: 'cartons', label: 'Cartons' },
    { value: 'dozens', label: 'Dozens' },
    { value: 'bundles', label: 'Bundles' },
    { value: 'palettes', label: 'Palettes' },
    { value: 'reels', label: 'Reels' },
    { value: 'crates', label: 'Crates' },
    { value: 'tubes', label: 'Tubes' },
    { value: 'bags', label: 'Bags' },
    { value: 'cans', label: 'Cans' },
    { value: 'bars', label: 'Bars' },
    { value: 'sacks', label: 'Sacks' },
    // Electrical-specific additions
    { value: 'squares', label: 'Squares' },  // For electrical panels/outlets
    { value: 'sheets', label: 'Sheets' },    // For insulation materials
    { value: 'drum', label: 'Drum' },        // For wire/cable drums
    { value: 'cases', label: 'Cases' },      // For electrical components
    { value: 'bottles', label: 'Bottles' },  // For chemicals/lubricants
    { value: 'jars', label: 'Jars' },        // For small components
    { value: 'trays', label: 'Trays' },      // For cable trays
    { value: 'tanks', label: 'Tanks' },      // For liquid storage
    { value: 'strips', label: 'Strips' },    // For LED strips/connectors
    { value: 'plates', label: 'Plates' },    // For switch plates
    { value: 'blocks', label: 'Blocks' },    // For terminal blocks
    { value: 'cubes', label: 'Cubes' },      // For fuse blocks
    { value: 'canisters', label: 'Canisters' }
  ];
  
  // Material suggestions state
  const [materials, setMaterials] = useState<MaterialDescription[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialDescription[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  
  // Preview modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState<EstimateDisplayData | null>(null);

  // Refs
  const descriptionInputRef = useRef<TextInput>(null);

  // Load user email when component mounts
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const email = await getUserEmail();
        if (email) {
          setUserEmail(email);
        } else {
          setShowEmailPrompt(true);
        }
      } catch (error) {
        console.error('Error loading user email:', error);
        setShowEmailPrompt(true);
      }
    };
    
    loadUserEmail();
  }, []);

  // Fetch material descriptions when component mounts
  useEffect(() => {
    fetchMaterialDescriptions();
  }, []);

  const fetchMaterialDescriptions = async () => {
    try {
      setIsFetchingMaterials(true);
      const materialData = await getMaterialDescriptions();
      setMaterials(materialData);
      setIsFetchingMaterials(false);
    } catch (error) {
      console.error("Error fetching material descriptions:", error);
      setIsFetchingMaterials(false);
      Alert.alert("Error", "Failed to load material descriptions");
    }
  };

  const filterMaterials = (text: string) => {
    if (!text.trim()) {
      setShowSuggestions(false);
      return;
    }

    const filtered = materials.filter(material => 
      material.name.toLowerCase().includes(text.toLowerCase())
    );
    
    setFilteredMaterials(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const addRow = () => {
    const newItem = { 
      quantity: "", 
      description: "", 
      unitPrice: "", 
      amount: "", 
      unit: "pieces" 
    };
    setRows([...rows, newItem]);
    setEditingItem(newItem);
    setModalVisible(true);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    }
  };

  const updateRow = (index: number, key: keyof EstimateItem, value: string) => {
    const newRows = [...rows];
    
    if (key === "quantity" || key === "description" || key === "unitPrice" || key === "amount") {
      newRows[index][key] = value;
    }
    
    if (key === "quantity" || key === "unitPrice") {
      const qty = parseFloat(newRows[index].quantity) || 0;
      const price = parseFloat(newRows[index].unitPrice) || 0;
      newRows[index].amount = (qty * price).toFixed(2);
    }
    
    setRows(newRows);
  };

  const editItem = (item: EstimateItem, index: number) => {
    setEditingItem({ 
      quantity: item.quantity || "",
      description: item.description || "",
      unitPrice: item.unitPrice || "",
      amount: item.amount || "",
      unit: item.unit || "pieces",
      chosen_material_id: item.chosen_material_id,
      index
    });
    setModalVisible(true);
  };

  const handleDescriptionChange = (text: string) => {
    setEditingItem({
      ...editingItem,
      description: text
    });
    filterMaterials(text);
  };

  const selectMaterial = (material: MaterialDescription) => {
    setEditingItem({
      ...editingItem,
      description: material.name,
      chosen_material_id: material.id
    });
    setShowSuggestions(false);
  };

  const saveItemChanges = () => {
    if (editingItem.index !== undefined) {
      const index = editingItem.index;
      const newRows = [...rows];
    
      newRows[index] = {
        quantity: editingItem.quantity || "",
        description: editingItem.description || "",
        unitPrice: editingItem.unitPrice || "",
        amount: editingItem.amount || "",
        unit: editingItem.unit || "pieces",
        chosen_material_id: editingItem.chosen_material_id
      };
    
      setRows(newRows);
      setModalVisible(false);
      setEditingItem({
        quantity: "",
        description: "",
        unitPrice: "",
        amount: "",
        index: undefined,
        chosen_material_id: undefined,
        unit: "pieces"
      });
      setShowSuggestions(false);
    } else {
      Alert.alert("Error", "Please fill in all fields before saving.");
    }
  };

  const calculateGrandTotal = () => {
    const materialsTotal = rows.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0);
  
    const workmanship = parseFloat(workmanshipPrice) || 0;
  
    return (materialsTotal + workmanship).toFixed(2);
  };

  const calculateTotal = () => {
    return rows.reduce((total, item) => {
      return total + (parseFloat(item.amount)) || 0;
    }, 0).toFixed(2);
  };

  const handlePreviewEstimate = async () => {
    if (!clientName.trim()) {
      Alert.alert("Missing Information", "Please enter a client name.");
      return;
    }

    if (!estimateTitle.trim()) {
      Alert.alert("Missing Information", "Please enter an estimate title.");
      return;
    }

    if (rows.length === 0 || !rows[0].description) {
      Alert.alert("Missing Information", "Please add at least one item.");
      return;
    }

    try {
      setIsLoading(true);
      
      const formattedItems: ApiEstimateItem[] = rows.map(row => ({
        description: row.description,
        quantity: parseFloat(row.quantity) || 0,
        unit_price: parseFloat(row.unitPrice) || 0,
        amount: parseFloat(row.amount) || 0,
        unit: row.unit || 'pieces',
        chosen_material_id: row.chosen_material_id
      }));

      const estimateData: ApiEstimateData = {
        user_email: userEmail,
        client_name: clientName,
        estimate_title: estimateTitle,
        notes: notes,
        workmanship: workmanshipPrice,
        total_materials: calculateTotal(),
        grand_total: calculateGrandTotal(),
        items: formattedItems
      };

      const response = await createEstimate(estimateData);
      setCreatedEstimateId(response.id);
      
      const displayItems = formattedItems.map(item => ({
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        price: item.unit_price,
        unit: item.unit,
        chosen_material_id: item.chosen_material_id
      }));
      
      const estimateDisplayData: EstimateDisplayData = {
        id: `EST-${response.id || Math.floor(100000 + Math.random() * 900000)}`,
        client: clientName,
        contactPerson: "", 
        email: "",
        status: "pending",
        createdAt: new Date().toISOString(),
        items: displayItems,
        notes: notes,
        totalMaterials: calculateTotal(),
        workmanship: workmanshipPrice,
        grandTotal: calculateGrandTotal()
      };

      setIsLoading(false);
      setModalVisible(false);
      setCurrentEstimate(estimateDisplayData);
      setPreviewModalVisible(true);
      onCreated();
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating estimate:", error);
      Alert.alert("Error", "Failed to create estimate. Please try again.");
    }
  };

  const handleDownloadPdf = async (onClose?: () => void) => {
    if (!createdEstimateId) {
      Alert.alert("Error", "No estimate created yet");
      return;
    }
  
    if (onClose) {
      onClose();
    }
  
    try {
      setIsLoading(true);
      
      const API_BASE_URL = 'https://estimatepro.pythonanywhere.com/api';
      const response = await axios.get(`${API_BASE_URL}/estimates/${createdEstimateId}/preview/`, {
        responseType: 'arraybuffer',
      });
      
      const base64String = Buffer.from(response.data).toString('base64');
      const fileName = `estimate_${createdEstimateId}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setIsLoading(false);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Estimate PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          "Sharing not available", 
          "Sharing is not available on this device. The PDF has been downloaded."
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error downloading or sharing PDF:", error);
      Alert.alert("Error", "Failed to download or share PDF. Please try again.");
    }
  };

  const renderEmailPrompt = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showEmailPrompt}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Your Email</Text>
          </View>
          
          <View style={styles.modalForm}>
            <Text style={styles.modalText}>
              Please provide your email to continue. All estimates will be associated with this email.
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput 
                style={styles.input}
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="Enter your email"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.saveItemButton} 
              onPress={async () => {
                if (userEmail.trim() !== '') {
                  await saveUserEmail(userEmail);
                  setShowEmailPrompt(false);
                } else {
                  Alert.alert("Required", "Please enter your email address");
                }
              }}
            >
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.saveItemButtonGradient}
              >
                <Text style={styles.saveItemButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Estimate</Text>
          </View>
          
          {/* Client Info Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Client Information</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput 
                style={styles.input}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Enter client name"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
          
          {/* Estimate Details Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Estimate Details</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Estimate Title</Text>
              <TextInput 
                style={styles.input}
                value={estimateTitle}
                onChangeText={setEstimateTitle}
                placeholder="Enter estimate title"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
          
          {/* Items Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Items</Text>
              <TouchableOpacity onPress={addRow} style={styles.addButton}>
                <LinearGradient
                  colors={['#6C5CE7', '#8E5CE7']}
                  style={styles.addButtonGradient}
                >
                  <MaterialIcons name="add" size={22} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {rows.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>No items added yet</Text>
                <TouchableOpacity onPress={addRow} style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>Add First Item</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {rows.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.itemCard}
                    onPress={() => editItem(item, index)}
                  >
                    <View style={styles.itemCardHeader}>
                      <Text style={styles.itemDescription} numberOfLines={1}>
                        {item.description || "Untitled Item"}
                      </Text>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => removeRow(index)}
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Qty</Text>
                        <Text style={styles.itemDetailValue}>{item.quantity || "0"} ({item.unit})</Text>
                      </View>
                      <View style={styles.itemDetail}>
                        <Text style={styles.itemDetailLabel}>Unit Price</Text>
                        <Text style={styles.itemDetailValue}>GHC {String(parseFloat(item.unitPrice || "0").toFixed(2))}</Text>
                      </View>
                      <View style={styles.itemDetailAmount}>
                        <Text style={styles.itemDetailLabel}>Amount</Text>
                        <Text style={styles.itemAmount}>GHC {String(parseFloat(item.amount || "0").toFixed(2))}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                    
                <View style={{flex:1, flexDirection:'row', alignItems:'center', justifyContent: 'space-between'}}>
                  <Text style={styles.totalLabel}>Total Cost of Materials</Text>
                  <Text style={styles.totalAmount}>GHC {calculateTotal()}</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Workmanship Price</Text>
                  <TextInput 
                    style={styles.input}
                    value={workmanshipPrice}
                    onChangeText={setWorkmanshipPrice}
                    placeholder="Enter Workmanship Price"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
            
            {rows.length > 0 && (
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>GHC {calculateGrandTotal()}</Text>
              </View>
            )}
          </View>
          
          {/* Notes Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Notes</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter any additional notes or terms"
                placeholderTextColor="#A0AEC0"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          {/* Submit button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handlePreviewEstimate}
          >
            <LinearGradient
              colors={['#6C5CE7', '#8E5CE7']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Save Estimate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Item Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setShowSuggestions(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem?.description ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  setShowSuggestions(false);
                }}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <View style={styles.autocompleteContainer}>
                  <TextInput 
                    ref={descriptionInputRef}
                    style={styles.input}
                    value={editingItem?.description || ""}
                    onChangeText={handleDescriptionChange}
                    placeholder="Start typing to search for materials..."
                    placeholderTextColor="#A0AEC0"
                  />
                  {isFetchingMaterials && (
                    <ActivityIndicator style={styles.inputRightIcon} size="small" color="#6C5CE7" />
                  )}
                  {!isFetchingMaterials && editingItem?.description && (
                    <TouchableOpacity 
                      style={styles.inputRightIcon}
                      onPress={() => {
                        setEditingItem({
                          ...editingItem,
                          description: "",
                          chosen_material_id: undefined
                        });
                        setShowSuggestions(false);
                      }}
                    >
                      <MaterialIcons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  
                  {showSuggestions && (
                    <View style={styles.suggestionsContainer}>
                      <FlatList
                        data={filteredMaterials.slice(0, 5)}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.suggestionItem}
                            onPress={() => selectMaterial(item)}
                          >
                            <Text style={styles.suggestionText}>{item.name}</Text>
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                          <Text style={styles.noSuggestionsText}>No matches found</Text>
                        )}
                      />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput 
                    style={styles.input}
                    value={editingItem?.quantity || ""}
                    onChangeText={(text) => {
                      const qty = text || "";
                      const price = parseFloat(editingItem?.unitPrice || "0") || 0;
                      const amount = (parseFloat(qty) * price).toFixed(2);
                      setEditingItem({
                        ...editingItem,
                        quantity: qty,
                        amount
                      });
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>

                <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <View style={[styles.pickerContainer, Platform.OS === 'android' && styles.androidPickerContainer]}>
                    <Picker
                      selectedValue={editingItem?.unit || 'pieces'}
                      onValueChange={(itemValue) => {
                        setEditingItem(prev => ({
                          ...prev,
                          unit: itemValue
                        }));
                      }}
                      mode="dropdown"
                      dropdownIconColor="#64748B"
                      style={styles.picker}
                    >
                      {UNIT_OPTIONS.map(option => (
                        <Picker.Item 
                          key={option.value} 
                          label={option.label} 
                          value={option.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={[styles.formGroup, {flex: 1.5}]}>
                  <Text style={styles.inputLabel}>Unit Price (GHC)</Text>
                  <TextInput 
                    style={styles.input}
                    value={editingItem?.unitPrice || ""}
                    onChangeText={(text) => {
                      const price = text || "";
                      const qty = parseFloat(editingItem.quantity || "0") || 0;
                      const amount = (qty * parseFloat(price)).toFixed(2);
                      setEditingItem({
                        ...editingItem,
                        unitPrice: price,
                        amount
                      });
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#A0AEC0"
                  />
                </View>
              </View>
              
              <View style={styles.amountPreview}>
                <Text style={styles.amountPreviewLabel}>Amount:</Text>
                <Text style={styles.amountPreviewValue}>
                  GHC{parseFloat(editingItem?.amount || "0").toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.saveItemButton} 
                onPress={saveItemChanges}
              >
                <LinearGradient
                  colors={['#6C5CE7', '#8E5CE7']}
                  style={styles.saveItemButtonGradient}
                >
                  <Text style={styles.saveItemButtonText}>
                    {editingItem?.description ? 'Update Item' : 'Add Item'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Estimate Preview Modal */}
      <EstimatePreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        estimateData={currentEstimate}
        onDownloadPdf={() => handleDownloadPdf(() => setPreviewModalVisible(false))}
      />
      
      {/* Email Prompt Modal */}
      {renderEmailPrompt()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  androidPickerContainer: {
    height: 48,
    paddingHorizontal: 8,
  },
  picker: {
    width: '100%',
    height: '100%',
    color: '#1E293B',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  formGroup: {
    gap: 6,
    marginBottom: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  unitOptionSelected: {
    backgroundColor: '#6C5CE7',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#64748B',
  },
  unitOptionTextSelected: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FCFCFC',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDetail: {
    flex: 1,
  },
  itemDetailAmount: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 16,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountPreview: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 8,
  },
  amountPreviewLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  amountPreviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveItemButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveItemButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveItemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 200,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  suggestionUnit: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  noSuggestionsText: {
    padding: 16,
    textAlign: 'center',
    color: '#64748B',
  },
  inputRightIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 12,
    fontSize: 16,
  },
});

export default CreateEstimate;