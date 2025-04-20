import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfileAPI } from '../utils/api';

// Define the props interface based on the backend model
interface UpdateProfileProps {
  visible: boolean;
  onClose: () => void;
  userData?: {
    email?: string;
    online_name?: string;
  };
  onEditPress?: () => void;
  onSave?: (data: any) => void;
}

export default function UpdateProfile({ 
  visible, 
  onClose, 
  userData, 
  onEditPress,
  onSave 
}: UpdateProfileProps) {
  const [profileData, setProfileData] = useState({
    email: userData?.email || '',
    online_name: userData?.online_name || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data when component mounts and modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchUserProfile();
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await UserProfileAPI.getProfile();
      if (data) {
        setProfileData({
          email: data.email || '',
          online_name: data.online_name || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await UserProfileAPI.updateProfile(profileData);
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(profileData);
      }
      
      Alert.alert('Success', 'Profile updated successfully');
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getInitials = () => {
    if (!profileData.online_name) return 'UN';
    return profileData.online_name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

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
            <Text style={styles.modalTitle}>Update Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading && !profileData.email ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C5CE7" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <ScrollView style={styles.formContainer}>
                <LinearGradient
                  colors={['#6C5CE7', '#8E5CE7']}
                  style={styles.avatarContainer}
                >
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                  <View style={styles.editIconContainer}>
                    <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
                  </View>
                </LinearGradient>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileData.online_name}
                    onChangeText={(text) => updateField('online_name', text)}
                    placeholder="Enter your name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileData.email}
                    onChangeText={(text) => updateField('email', text)}
                    placeholder="Enter email address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false} // Email should be read-only as it's the unique identifier
                  />
                  <Text style={styles.helperText}>Email address cannot be changed</Text>
                </View>
              </ScrollView>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, loading && styles.disabledButton]} 
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    minHeight: '80%',
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
  formContainer: {
    padding: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C5CE7',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 10,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#A5A6F6',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 4,
  },
});