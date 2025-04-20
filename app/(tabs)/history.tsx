import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import EstimatePreviewModal from '../../components/EstimatePreviewModal';
import CreateEstimate from '../../components/CreateEstimate';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getUserEmail } from '../../utils/userStore';

const { width } = Dimensions.get('window');

// Define the API base URL
const API_BASE_URL = 'http://192.168.56.64:8000/api';

// Define the interfaces based on the backend models
interface EstimateItem {
  chosen_material: any;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Estimate {
  id: number;
  client_name: string;
  estimate_title: string;
  notes: string;
  workmanship: number;
  total_materials: number;
  grand_total: number;
  created_at: string;
  items: EstimateItem[];
  status?: string; // Added for status display
}

// Interface for formatted estimate data that EstimatePreviewModal expects
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
    chosen_material_id?: number;
  }[];
  notes: string;
  totalMaterials: string;
  workmanship: string;
  grandTotal: string;
}

// New interface for user profile data
interface UserProfileData {
  online_name: string;
  profile_pic: string | null;
  business_name?: string;
}

export default function History() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateDisplayData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    online_name: "Your Business",
    profile_pic: null
  });
  
  const openModal = () => setShowEstimateModal(true);
  const closeModal = () => setShowEstimateModal(false);
  
  useEffect(() => {
    fetchEstimates();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
     
      const userEmail = await getUserEmail();
      if (!userEmail) {
        console.warn("No user email found in storage.");
        return;
      }
  
      const response = await axios.get(`${API_BASE_URL}/onboarding/`, {
        params: { email: userEmail }
      });
  
      if (response.data) {
        setUserProfile({
          online_name: response.data.online_name || "Your Business",
          business_name: response.data.business_name || "Business Name",
          profile_pic: response.data.profile_pic || null
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/all-estimates/`);
      const estimatesWithStatus = response.data.map((est: Estimate) => ({
        ...est,
        status: est.status || ['pending', 'sent', 'accepted'][Math.floor(Math.random() * 3)]
      }));
      setEstimates(estimatesWithStatus);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      Alert.alert('Error', 'Failed to load estimates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  
  const formatEstimateForDisplay = (estimate: Estimate): EstimateDisplayData => {
    return {
      id: `EST-${estimate.id}`,
      client: estimate.client_name,
      contactPerson: "",
      email: "",
      status: estimate.status || "pending",
      createdAt: estimate.created_at,
      items: estimate.items.map(item => ({
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        price: item.unit_price,
        chosen_material_id: item.chosen_material?.id
      })),
      notes: estimate.notes,
      totalMaterials: estimate.total_materials.toString(),
      workmanship: estimate.workmanship.toString(),
      grandTotal: estimate.grand_total.toString()
    };
  };


  const handleEstimatePress = (estimate: Estimate) => {
    const formattedEstimate = formatEstimateForDisplay(estimate);
    setSelectedEstimate(formattedEstimate);
    setModalVisible(true);
  };

  // Function to handle PDF download and sharing
  const handleDownloadPdf = async (onClose?: () => void) => {
    if (!selectedEstimate) {
      Alert.alert("Error", "No estimate selected");
      return;
    }
  
    // Close the modal if callback provided
    if (onClose) {
      onClose();
    }
    
    // Extract the ID from the formatted ID (removing the "EST-" prefix)
    const estimateId = selectedEstimate.id.replace('EST-', '');
    
    try {
      setIsSharing(true);
      
      // Make the API request
      const response = await axios.get(`${API_BASE_URL}/estimates/${estimateId}/preview/`, {
        responseType: 'arraybuffer'
      });
      
      // Convert arraybuffer to base64 string correctly in React Native
      const base64Data = arrayBufferToBase64(response.data);
      
      // Create a temporary file path for the PDF
      const fileName = `estimate_${estimateId}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Write the base64 file
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Estimate PDF',
          UTI: 'com.adobe.pdf', // for iOS
        });
      } else {
        Alert.alert(
          "Sharing not available", 
          "Sharing is not available on this device. The PDF has been downloaded."
        );
      }
    } catch (error) {
      console.error("Error downloading or sharing PDF:", error);
      Alert.alert("Error", "Failed to download or share PDF. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const goBack = () => {
    router.back();
  };

  const goToProfile = () =>{
    router.replace('/settings')
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter estimates by status
  const getFilteredEstimates = () => {
    if (filterStatus === 'all') return estimates;
    return estimates.filter(est => est.status === filterStatus);
  };

  // Render status badge with proper colors
  // const renderStatusBadge = (status: string) => {
  //   let colors;
  //   let iconName;
  
  //   switch (status) {
  //     case 'sent':
  //       colors = ['#6C5CE7', '#8E5CE7'];
  //       iconName = 'paper-plane';
  //       break;
  //     case 'accepted':
  //       colors = ['#00B894', '#00CEC9'];
  //       iconName = 'checkmark-circle';
  //       break;
  //     default:
  //       colors = ['#B2BEC3', '#DFE6E9'];
  //       iconName = 'hourglass';
  //   }
    
  //   return (
  //     <LinearGradient
  //       colors={colors}
  //       style={styles.statusBadge}
  //       start={{ x: 0, y: 0 }}
  //       end={{ x: 1, y: 1 }}
  //     >
  //       <Ionicons name={iconName} size={12} color="#FFFFFF" style={styles.statusIcon} />
  //       <Text style={styles.statusText}>{status}</Text>
  //     </LinearGradient>
  //   );
  // };

  // Generate initials for profile avatar
  const getInitials = (name: string) => {
    if (!name) return "YB";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Calculate total statistics
 // Calculate total amount across all estimates
 const getTotalAmount = () => {
  if (!estimates || estimates.length === 0) return "0.00";
  const total = estimates.reduce((sum, est) => {
    // Convert the grand_total to a number (if it's a string)
    const grandTotal = parseFloat(est.grand_total as any) || 0;
    return sum + grandTotal;
  }, 0);
  return total.toFixed(2);
};

  const getEstimateCount = () => {
    return estimates.length;
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Sharing Indicator */}
      {isSharing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Processing PDF...</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Hello there,</Text>
        <Text style={styles.businessName}>
          {userProfile?.online_name ? userProfile.online_name : "Your Business"}
        </Text>
      </View>
      <TouchableOpacity style={styles.profileButton} onPress = {goToProfile}>
          <LinearGradient
            colors={['#6C5CE7', '#8E5CE7']}
            style={styles.profileGradient}
          >
            <Text style={styles.profileInitials}>
              {getInitials(userProfile?.online_name || "User")}
            </Text>
          </LinearGradient>
      </TouchableOpacity>
    </View>

      {/* Summary Section */}
      <View style={styles.summarySection}>
        <LinearGradient
          colors={['#6C5CE7', '#8E5CE7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIconContainer}>
              <MaterialCommunityIcons name="calculator-variant" size={22} color="#FFFFFF" />
            </View>
            <MaterialIcons name="more-horiz" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryTitle}>Total Estimates</Text>
          <Text style={styles.summaryAmount}>GHC {getTotalAmount()}</Text>
          <View style={styles.summaryBottomRow}>
            <Text style={styles.summarySubtext}>{getEstimateCount()} estimates</Text>
            <View style={styles.arrowIndicator}>
              <MaterialIcons name="trending-up" size={16} color="#FFFFFF" />
              <Text style={styles.percentageText}>+12%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      

      {/* Estimate List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading estimates...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={getFilteredEstimates()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              // Safely get the grand total value
              let grandTotal = 0;
              if (typeof item.grand_total === 'number') {
                grandTotal = item.grand_total;
              } else if (typeof item.grand_total === 'string') {
                grandTotal = parseFloat(item.grand_total) || 0;
              }
            
              return (
                <TouchableOpacity 
                  style={styles.itemCard}
                  onPress={() => handleEstimatePress(item)}
                >
                  <View style={styles.itemTopRow}>
                    <Text style={styles.clientName}>{item.client_name}</Text>
                    {/* {renderStatusBadge(item.status || 'pending')} */}
                  </View>
                  <Text style={styles.estimateTitle}>{item.estimate_title}</Text>
                  <View style={styles.itemBottomRow}>
                    <View style={styles.dateContainer}>
                      <MaterialIcons name="event" size={16} color="#64748B" />
                      <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
                    </View>
                    <Text style={styles.itemAmount}>GHC {grandTotal.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <MaterialIcons name="receipt-long" size={64} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>No estimates found</Text>
                <Text style={styles.emptyStateSubtext}>Create your first estimate to get started</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={openModal}
                >
                  <LinearGradient
                    colors={['#6C5CE7', '#8E5CE7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>Create Estimate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Floating Action Button */}
          <TouchableOpacity style={styles.fab} onPress={openModal}>
            <LinearGradient
              colors={['#00B894', '#00CEC9']}
              style={styles.fabGradient}
            >
              <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      {/* Estimate Modal */}
      <Modal
        visible={showEstimateModal}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            onPress={closeModal} 
            style={{ position: 'absolute', top: 18, right: 10, zIndex: 1 }}
          >
            <MaterialCommunityIcons name="close-circle" size={30} color="#64748B" />
          </TouchableOpacity>
          <CreateEstimate onCreated={() => {
            closeModal();
            fetchEstimates(); // Refresh estimates after creating a new one
          }} />
        </View>
      </Modal>

      {/* Preview Modal */}
      {selectedEstimate && (
        <EstimatePreviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        estimateData={selectedEstimate}
        onDownloadPdf={() => handleDownloadPdf(() => setModalVisible(false))}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  profileButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 15,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 5,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  arrowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  activeFilterTab: {
    backgroundColor: '#6C5CE7',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  flatListContent: {
    padding: 20,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  estimateTitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
});