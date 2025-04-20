import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { width, height } = Dimensions.get('window');

// Define the props interface
interface EstimatePreviewModalProps { 
  visible: boolean; 
  onClose: () => void; 
  estimateData: any; 
  //onDownloadPdf: () => void; 
  onDownloadPdf: () => Promise<void>; // Make it async
  onDownloadStart?: () => void; // Add this new prop
}

const EstimatePreviewModal: React.FC<EstimatePreviewModalProps> = ({ 
  visible, 
  onClose, 
  estimateData, 
  onDownloadPdf
}) => {
  // Animation value for modal entrance
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  
  useEffect(() => {
    if (visible) {
      // Animate modal entrance
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation when modal is closed
      slideAnim.setValue(height);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    // Animate modal exit
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Format estimate date to display format
  const formatDate = (dateString : any) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!estimateData) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Estimate Preview</Text>
            <View style={styles.headerButtons}>
                <TouchableOpacity 
                onPress={async () => {
                  await onDownloadPdf();
                }}
                style={styles.headerButton}
              >
                <MaterialIcons name="file-download" size={24} color="#6C5CE7" />
              </TouchableOpacity>

            </View>
          </View>

          {/* Success Banner */}
          <View style={styles.successBanner}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.successIconGradient}
              >
                <MaterialIcons name="check" size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successText}>Estimate Created Successfully!</Text>
          </View>

          {/* Estimate Preview Content */}
          <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
            {/* Estimate Header */}
            <View style={styles.estimateHeader}>
              <View style={styles.estimateInfo}>
                <Text style={styles.estimateLabel}>Estimate #{estimateData.id || '001'}</Text>
                <Text style={styles.estimateDate}>
                  Created on {formatDate(estimateData.createdAt || new Date())}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                {renderStatusBadge(estimateData.status || 'pending')}
              </View>
            </View>

            {/* Client Information */}
            <View style={styles.clientSection}>
              <Text style={styles.sectionTitle}>Client</Text>
              <View style={styles.clientCard}>
                <View style={styles.clientAvatar}>
                  <LinearGradient
                    colors={['#6C5CE7', '#8E5CE7']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitials}>
                      {estimateData.client?.charAt(0) || 'C'}
                    </Text>
                  </LinearGradient>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>{estimateData.client || 'Client Name'}</Text>
                  <Text style={styles.clientContact}>
                    {estimateData.contactPerson || 'Contact Person'}
                  </Text>
                  <View style={styles.contactInfoItem}>
                    <MaterialIcons name="email" size={14} color="#64748B" style={styles.contactIcon} />
                    <Text style={styles.contactText}>
                      {estimateData.email || 'client@example.com'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Estimate Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items</Text>
              <View style={styles.itemsCard}>
                {(estimateData.items || []).map((item : any, index : any) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemDetail}>
                      <Text style={styles.itemName}>{item.name || `Item ${index + 1}`}</Text>
                      <Text style={styles.itemDescription}>
                        {item.description || 'Item description'}
                      </Text>
                    </View>
                    <View style={styles.itemPricing}>
                      <Text style={styles.itemQuantity}>
                        {item.quantity || 1} × ${item.price || '0.00'}
                      </Text>
                      <Text style={styles.itemTotal}>
                        ${(item.quantity * item.price).toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                ))}
                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Materials</Text>
                    <Text style={styles.totalValue}>
                      ${estimateData.totalMaterials || '0.00'}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Workmanship</Text>
                    <Text style={styles.totalValue}>
                      ${estimateData.workmanship || '0.00'}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Total</Text>
                    <Text style={styles.grandTotalValue}>
                      ${estimateData.grandTotal || '0.00'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>
                  {estimateData.notes || 'No notes provided for this estimate.'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
            <TouchableOpacity 
              onPress={async () => {
                await onDownloadPdf();
              }} 
              style={styles.actionButton}
            >
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.actionButtonGradient}
              >
                <FontAwesome5 name="share-alt" size={16} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.actionButtonText}>Share Estimate</Text>
              </LinearGradient>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Helper functions for calculations
const calculateSubtotal = (items:any) => {
  const subtotal = items.reduce((acc:any, item:any) => {
    return acc + (item.quantity || 1) * (item.price || 0);
  }, 0);
  return subtotal.toFixed(2);
};

const calculateTax = (items:any, taxRate:any) => {
  const subtotal = items.reduce((acc:any, item:any) => {
    return acc + (item.quantity || 1) * (item.price || 0);
  }, 0);
  return (subtotal * taxRate).toFixed(2);
};

const calculateTotal = (items:any, taxRate:any) => {
  const subtotal = items.reduce((acc:any, item:any) => {
    return acc + (item.quantity || 1) * (item.price || 0);
  }, 0);
  return (subtotal + (subtotal * taxRate)).toFixed(2);
};

// Function to render status badge for estimates
const renderStatusBadge = (status : any) => {
  let backgroundColor;
  let textColor = '#FFFFFF';

  switch (status) {
    case 'sent':
      backgroundColor = '#6C5CE7';
      break;
    case 'accepted':
      backgroundColor = '#00B894';
      break;
    case 'pending':
      backgroundColor = '#FDCB6E';
      textColor = '#2D3436';
      break;
    default:
      backgroundColor = '#B2BEC3';
  }
  
  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: height * 0.9,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  successBanner: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successIconContainer: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  estimateInfo: {
    flex: 1,
  },
  estimateLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  estimateDate: {
    fontSize: 14,
    color: '#64748B',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  clientSection: {
    marginBottom: 24,
  },
  clientCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  clientAvatar: {
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  clientContact: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactIcon: {
    marginRight: 5,
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
  },
  itemsSection: {
    marginBottom: 24,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemDetail: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 40,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EstimatePreviewModal;