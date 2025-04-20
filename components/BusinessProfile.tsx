import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessProfileAPI } from '../utils/api';

interface BusinessProfileProps {
  visible: boolean;
  onClose: () => void;
  onEditPress?: () => void;
  userData: {
    business_name: string;
    email: string;
    phone: string;
    address: string;
    website?: string;
    tax_id?: string;
    established?: string;
    industry?: string;
    description?: string;
  };
  onSave?: (data: any) => void;
}

export default function BusinessProfile({ 
  visible, 
  onClose, 
  onEditPress,
  userData,
  onSave 
}: BusinessProfileProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    address: '',
    website: '',
    tax_id: '',
    established: '',
    industry: '',
    description: '',
    // Keep email field to send with API requests
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch business profile data when component mounts and modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchBusinessProfile();
    }
  }, [visible]);

  const fetchBusinessProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await BusinessProfileAPI.getBusinessProfile();
      if (data) {
        setFormData({
          business_name: data.business_name || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || '',
          tax_id: data.tax_id || '',
          established: data.established || '',
          industry: data.industry || '',
          description: data.description || '',
          email: data.email || ''
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch business profile:', err);
      setError('Failed to load business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await BusinessProfileAPI.updateBusinessProfile(formData);
      setEditMode(false);
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(formData);
      }
      
      Alert.alert('Success', 'Business profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update business profile:', err);
      setError('Failed to update business profile. Please try again.');
      Alert.alert('Error', 'Failed to update business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'BP';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderField = (label: string, value: string | undefined, icon: React.ReactNode, key: string) => {
    return (
      <View style={styles.infoRow} key={key}>
        <View style={styles.infoLabelContainer}>
          {icon}
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        {editMode ? (
          <TextInput
            style={styles.editInput}
            value={value || ''}
            onChangeText={(text) => setFormData({...formData, [key]: text})}
            placeholder={`Enter ${label}`}
          />
        ) : (
          <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
        )}
      </View>
    );
  };

  if (loading && !editMode) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.handleBar}></View>
              <Text style={styles.modalTitle}>Business Profile</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading business profile...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.handleBar}></View>
            <Text style={styles.modalTitle}>Business Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <LinearGradient
              colors={['#6C5CE7', '#8E5CE7']}
              style={styles.profileHeaderGradient}
            >
              <View style={styles.profileHeaderContent}>
                <LinearGradient
                  colors={['#6C5CE7', '#8E5CE7']}
                  style={styles.avatarContainer}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(formData.business_name)}
                  </Text>
                </LinearGradient>
                <Text style={styles.businessName}>{formData.business_name}</Text>
                {formData.industry && (
                  <View style={styles.industryBadge}>
                    <Text style={styles.industryText}>{formData.industry}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.card}>
                {renderField('Phone', formData.phone, 
                  <MaterialIcons name="phone" size={18} color="#6C5CE7" />, 
                  'phone'
                )}
                {renderField('Address', formData.address, 
                  <MaterialIcons name="location-on" size={18} color="#6C5CE7" />, 
                  'address'
                )}
                {renderField('Website', formData.website, 
                  <MaterialIcons name="language" size={18} color="#6C5CE7" />, 
                  'website'
                )}
              </View>
            </View>

            {/* Business Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>
              <View style={styles.card}>
                {renderField('Business Name', formData.business_name, 
                  <MaterialIcons name="business" size={18} color="#6C5CE7" />, 
                  'business_name'
                )}
                {renderField('Tax ID', formData.tax_id, 
                  <FontAwesome5 name="id-card" size={16} color="#6C5CE7" />, 
                  'tax_id'
                )}
                {renderField('Established', formData.established, 
                  <FontAwesome5 name="calendar-alt" size={16} color="#6C5CE7" />, 
                  'established'
                )}
                {renderField('Industry', formData.industry, 
                  <FontAwesome5 name="industry" size={16} color="#6C5CE7" />, 
                  'industry'
                )}
              </View>
            </View>

            {/* Business Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Business</Text>
              <View style={styles.card}>
                {editMode ? (
                  <TextInput
                    style={[styles.descriptionText, styles.editTextArea]}
                    multiline
                    numberOfLines={4}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter business description"
                  />
                ) : (
                  <Text style={styles.descriptionText}>
                    {formData.description || 'No description provided'}
                  </Text>
                )}
              </View>
            </View>

            {/* Edit/Save Button */}
            <TouchableOpacity 
              style={[
                styles.editButton,
                loading && styles.disabledButton
              ]}
              onPress={editMode ? handleSave : () => setEditMode(true)}
              disabled={loading}
            >
              {loading && editMode ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.editButtonText}>
                  {editMode ? 'Save Changes' : 'Edit Business Profile'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeaderGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  industryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  industryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 15,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    paddingVertical: 16,
  },
  editButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editTextArea: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    paddingVertical: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
  },
  editInput: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    paddingVertical: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#A5A6F6',
  },
});