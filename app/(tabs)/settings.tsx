import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Ionicons,
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UpdateProfile from '../../components/UpdateProfile';
import BusinessProfile from '../../components/BusinessProfile';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { UserProfileAPI, BusinessProfileAPI } from '../../utils/api';
import { getUserEmail, clearUserEmail } from '../../utils/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings() {
  const router = useRouter();
  const [updateProfileVisible, setUpdateProfileVisible] = useState(false);
  const [businessProfileVisible, setBusinessProfileVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userData, setUserData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: ''
  });

  const [businessData, setBusinessData] = useState({
    website: '',
    taxId: '',
    established: '',
    industry: '',
    description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching profile data...');
        
        const [userProfile, businessProfile] = await Promise.all([
          UserProfileAPI.getProfile(),
          BusinessProfileAPI.getBusinessProfile()
        ]);
        
        console.log('User profile response:', userProfile);
        console.log('Business profile response:', businessProfile);
        
        // Set user data from both responses correctly mapping to your models
        setUserData({
          businessName: businessProfile.business_name || '',
          email: userProfile.email || '',
          phone: businessProfile.phone || '',
          address: businessProfile.address || ''
        });

        setBusinessData({
          website: businessProfile.website || '',
          taxId: businessProfile.tax_id || '',
          established: businessProfile.established || '',
          industry: businessProfile.industry || '',
          description: businessProfile.description || ''
        });
      } catch (error) {
        console.error('Failed to load profiles:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateProfile = async (updatedData: any) => {
    try {
      // Update user profile (email only)
      const userProfileData = {
        email: updatedData.email,
      };
      
      // Update business profile (business details)
      const businessProfileData = {
        business_name: updatedData.businessName,
        phone: updatedData.phone,
        address: updatedData.address,
        email: updatedData.email, // needed for API request
      };
      
      // Update both profiles
      await Promise.all([
        UserProfileAPI.updateProfile(userProfileData),
        BusinessProfileAPI.updateBusinessProfile(businessProfileData)
      ]);
      
      // Update local state
      setUserData({
        businessName: businessProfileData.business_name,
        email: userProfileData.email,
        phone: businessProfileData.phone,
        address: businessProfileData.address
      });
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleUpdateBusinessProfile = async (updatedData: any) => {
    try {
      const response = await BusinessProfileAPI.updateBusinessProfile({
        website: updatedData.website,
        tax_id: updatedData.taxId,
        established: updatedData.established,
        industry: updatedData.industry, 
        description: updatedData.description,
        email: userData.email, // needed for API request
      });
      
      setBusinessData({
        website: response.website || '',
        taxId: response.tax_id || '',
        established: response.established || '',
        industry: response.industry || '',
        description: response.description || ''
      });
      
      Alert.alert('Success', 'Business profile updated successfully');
    } catch (error) {
      console.error('Update business profile error:', error);
      Alert.alert('Error', 'Failed to update business profile');
    }
  };

 
  
  const handleDeleteAccount = async () => {
    try {
      // Get email before attempting deletion
      const email = await getUserEmail();
      
      if (!email) {
        console.log('No email found, only clearing local storage');
        // Even without email, clear local storage and redirect to onboarding
        await AsyncStorage.multiRemove(['hasSeenOnboarding', 'userEmail']);
        router.replace('/onboarding');
        return;
      }
      
      // If we have an email, attempt backend deletion.
      // Note: It's up to your API to return a response when a user is not found.
      try {
        await UserProfileAPI.deleteAccount();
      } catch (apiError) {
        // Check if the error indicates that the user was not found.
        console.error('API deletion error:', apiError);
        // Optionally add logic to check the error status or message.
        // Regardless of the error, continue with clearing local storage and redirect.
      }
      
      // Clear ALL relevant AsyncStorage keys and navigate to onboarding.
      await AsyncStorage.multiRemove(['hasSeenOnboarding', 'userEmail']);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. Try again later.');
      setDeleteAccountVisible(false);
    }
  };

  const handleEditFromBusinessProfile = () => {
    setBusinessProfileVisible(false);
    setTimeout(() => setUpdateProfileVisible(true), 300);
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.emptySpace} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['#6C5CE7', '#8E5CE7']}
            style={styles.profileGradientBackground}
          >
            <View style={styles.profileInfoContainer}>
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.avatarContainer}
              >
                <Text style={styles.avatarText}>
                  {getInitials(userData.businessName)}
                </Text>
              </LinearGradient>
              
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileName}>{userData.businessName}</Text>
                <Text style={styles.profileEmail}>{userData.email}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => setUpdateProfileVisible(true)}
                style={styles.editProfileButton}
              >
                <Feather name="edit-2" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        
        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => setBusinessProfileVisible(true)}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialIcons name="business" size={18} color="#4CAF50" />
                </View>
                <Text style={styles.settingsItemText}>Business Profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Info */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          <View style={styles.settingsCard}>
            {[
              { icon: 'help-outline', color: '#F44336', bg: '#FFEBEE', text: 'Help Center' },
              { icon: 'privacy-tip', color: '#00BCD4', bg: '#E0F7FA', text: 'Privacy Policy' },
              // { icon: 'description', color: '#9C27B0', bg: '#F3E5F5', text: 'Terms of Service' },
              { icon: 'information-circle-outline', color: '#FFC107', bg: '#FFF8E1', text: 'About' },
            ].map((item, index) => (
              <TouchableOpacity 
                key={item.text}
                style={[styles.settingsItem, index === 3 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: item.bg }]}>
                    <MaterialIcons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.settingsItemText}>{item.text}</Text>
                </View>
                {index === 3 ? (
                  <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>v1.0.0</Text>
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Delete Account Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => setDeleteAccountVisible(true)}
        >
          <MaterialIcons name="delete" size={18} color="#F87171" />
          <Text style={styles.signOutText}>Delete Account</Text>
        </TouchableOpacity>
        
        {/* Developer Information */}
        <View style={styles.developerInfo}>
          <Text style={styles.developerInfoText}>© 2025 EstimatePro</Text>
          <Text style={styles.developerInfoSubtext}>Made with ♥ by Rockson Owusu</Text>
        </View>
      </ScrollView>
      
      {/* Modals */}
      <UpdateProfile 
        visible={updateProfileVisible}
        onClose={() => setUpdateProfileVisible(false)}
        userData={userData}
        onSave={handleUpdateProfile}
      />
      
      <BusinessProfile 
        visible={businessProfileVisible}
        onClose={() => setBusinessProfileVisible(false)}
        onEditPress={handleEditFromBusinessProfile}
        userData={{ ...userData, ...businessData }}
        onSave={handleUpdateBusinessProfile}
      />
      
      <DeleteAccountModal
        visible={deleteAccountVisible}
        onClose={() => setDeleteAccountVisible(false)}
        onConfirm={handleDeleteAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptySpace: {
    width: 40,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileGradientBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 5,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsToggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingsItemText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  versionContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#64748B',
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
  },
  signOutText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  developerInfo: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  developerInfoText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 5,
  },
  developerInfoSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
});