import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { submitOnboarding } from '../../ts/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [letterhead, setLetterhead] = useState(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Business profile data
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessTaxId, setBusinessTaxId] = useState('');
  const [businessEstablished, setBusinessEstablished] = useState('');
  const [businessIndustry, setBusinessIndustry] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  // Field errors
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if(seen === 'true'){
          router.replace('/(tabs)/history');
        }
      } catch(error) { // Changed from "catch{" to "catch(error) {"
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboardingStatus();
  }, []); // Added the missing dependency array
  
  useEffect(() => {
    // Reset and start animations when step changes
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [step]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const pickImage = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access media library is required!");
      return;
    }
    
    try {
      // Using updated API - using MediaTypeOptions instead of MediaType
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated from MediaType to MediaTypeOptions
        quality: 1,
        allowsEditing: true,
      });
      
      // Check if image was selected
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Create a file name for the image (extract from URI)
        const uriParts = selectedAsset.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        // Add file type and name to the result object
        const enhancedResult = {
          uri: selectedAsset.uri,
          type: selectedAsset.mimeType || 'image/jpeg',
          name: fileName,
          assets: result.assets
        };
        
        setLetterhead(enhancedResult);
        console.log("Image selected successfully:", enhancedResult);
      } else {
        console.log("Image selection cancelled");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was an error selecting the image. Please try again.");
    }
  };

  const validateBusinessProfile = () => {
    let isValid = true;

    if (!businessName.trim()) {
      setNameError('Business name is required');
      isValid = false;
    }

    if (!businessPhone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!validatePhone(businessPhone)) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
    }

    if (!businessAddress.trim()) {
      setAddressError('Business address is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmitOnboarding = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare the data according to the interface
      const onboardingData = {
        email,
        name: businessName,
        phone: businessPhone,
        address: businessAddress,
        website: businessWebsite || undefined,
        taxId: businessTaxId || undefined,
        established: businessEstablished || undefined,
        industry: businessIndustry || undefined,
        description: businessDescription || undefined,
        letterhead: letterhead ? {
          uri: letterhead.uri || letterhead.assets?.[0]?.uri,
          type: letterhead.type || 'image/jpeg',
          name: letterhead.name || 'letterhead.jpg'
        } : undefined
      };
      
      // Call the API function
      const response = await submitOnboarding(onboardingData);
      // Handle success
      console.log('Onboarding submitted successfully:', response);
      // After successful submission
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');      // Navigate to dashboard
      router.replace('/(tabs)/history');
    } catch (error) {
      // Handle error
      console.error('Error submitting onboarding data:', error);
      
      let errorMessage = 'An error occurred during submission. Please try again.';
      
      if (error.response && error.response.data) {
        // If there's a specific error message from the API
        const apiErrors = error.response.data;
        if (typeof apiErrors === 'object') {
          errorMessage = Object.values(apiErrors).flat().join('\n');
        } else if (typeof apiErrors === 'string') {
          errorMessage = apiErrors;
        }
      }
      
      Alert.alert('Submission Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // Email validation
    if (step === 1 && (!email || !validateEmail(email))) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Letterhead validation
    if (step === 3 && !letterhead) {
      Alert.alert("Image Required", "Please upload your Company Letterhead to continue.");
      return;
    }

    // Business profile validation (step 4 is the first business profile step)
    if (step === 4) {
      if (!validateBusinessProfile()) {
        return;
      }
    }
    
    // Determine max steps (including business profile steps)
    const maxSteps = 6;
    
    if (step < maxSteps) {
      setStep(step + 1);
      setEmailError('');
      setNameError('');
      setPhoneError('');
      setAddressError('');
    } else {
      // Final step - submit to API
      handleSubmitOnboarding();
    }
  };

  const handleSkip = async () => {
    // Save onboarding status when skipping
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/(tabs)/history');
  };
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setEmailError('');
      setNameError('');
      setPhoneError('');
      setAddressError('');
    }
  };

  const renderProgressIndicator = () => {
    // Increased to 7 steps (0-6)
    return (
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <View 
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#6C5CE7' : '#E0E0E0' }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    };

    switch (step) {
      case 0:
        return (
          <Animated.View style={[styles.contentContainer, animatedStyle]}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.iconBackground}
              >
                <MaterialCommunityIcons name="file-document-edit" size={60} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome to EstimatePro</Text>
            <Text style={styles.subtitle}>
              Create stunning professional estimates in minutes
            </Text>
          </Animated.View>
        );
      case 1:
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.contentContainer, animatedStyle]}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#6C5CE7', '#8E5CE7']}
                  style={styles.iconBackground}
                >
                  <MaterialIcons name="email" size={60} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Your Email</Text>
              <Text style={styles.subtitle}>
                We'll use this to send estimate notifications and account updates
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, emailError ? styles.inputError : null]}
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        );
      case 2:
        return (
          <Animated.View style={[styles.contentContainer, animatedStyle]}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.iconBackground}
              >
                <MaterialCommunityIcons name="palette-outline" size={60} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Personalize Your Brand</Text>
            <Text style={styles.subtitle}>
              Add your company letterhead to create professional and branded invoices that impress clients
            </Text>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View style={[styles.contentContainer, animatedStyle]}>
            <Text style={styles.title}>Upload Your Letterhead</Text>
            <Text style={styles.subtitle}>
              Select an image that represents your brand and creates a professional impression
            </Text>
            
            {letterhead ? (
              <View style={styles.previewContainer}>
                <Image 
                  source={{ uri: letterhead.uri || letterhead.assets?.[0]?.uri }} 
                  style={styles.previewImage} 
                />
                <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                  <Text style={styles.changeButtonText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButtonContainer} onPress={pickImage}>
                <View style={styles.uploadButton}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#6C5CE7" />
                  <Text style={styles.uploadText}>Upload Letterhead</Text>
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>
        );
      case 4:
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : null}
            style={{flex: 1}}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.contentContainer, animatedStyle, {paddingTop: 20}]}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={['#6C5CE7', '#8E5CE7']}
                      style={styles.iconBackground}
                    >
                      <MaterialIcons name="business" size={60} color="white" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.title}>Business Details</Text>
                  <Text style={styles.subtitle}>
                    Let's set up your business profile to create professional estimates
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Business Name</Text>
                    <TextInput
                      style={[styles.textInput, nameError ? styles.inputError : null]}
                      placeholder="Enter your business name"
                      value={businessName}
                      onChangeText={(text) => {
                        setBusinessName(text);
                        if (nameError) setNameError('');
                      }}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                    
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={[styles.textInput, phoneError ? styles.inputError : null]}
                      placeholder="Enter your phone number"
                      value={businessPhone}
                      onChangeText={(text) => {
                        setBusinessPhone(text);
                        if (phoneError) setPhoneError('');
                      }}
                      keyboardType="phone-pad"
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                    
                    <Text style={styles.inputLabel}>Business Address</Text>
                    <TextInput
                      style={[styles.textInput, addressError ? styles.inputError : null]}
                      placeholder="Enter your business address"
                      value={businessAddress}
                      onChangeText={(text) => {
                        setBusinessAddress(text);
                        if (addressError) setAddressError('');
                      }}
                    />
                    {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
                  </View>
                </Animated.View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        );
      case 5:
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : null}
            style={{flex: 1}}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.contentContainer, animatedStyle, {paddingTop: 20}]}>
                  <Text style={styles.title}>Additional Info</Text>
                  <Text style={styles.subtitle}>
                    Add more details about your business (optional)
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Website (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="www.yourbusiness.com"
                      value={businessWebsite}
                      onChangeText={setBusinessWebsite}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                    
                    <Text style={styles.inputLabel}>Tax ID (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="TAX-12345"
                      value={businessTaxId}
                      onChangeText={setBusinessTaxId}
                    />
                    
                    <Text style={styles.inputLabel}>Year Established (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="2023"
                      value={businessEstablished}
                      onChangeText={setBusinessEstablished}
                      keyboardType="numeric"
                    />
                    
                    <Text style={styles.inputLabel}>Industry (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Electrical Construction"
                      value={businessIndustry}
                      onChangeText={setBusinessIndustry}
                    />
                  </View>
                </Animated.View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        );
      case 6:
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : null}
            style={{flex: 1}}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.contentContainer, animatedStyle, {paddingTop: 20}]}>
                  <Text style={styles.title}>Business Description</Text>
                  <Text style={styles.subtitle}>
                    Tell your clients about your business
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Describe your services and what makes your business unique..."
                      value={businessDescription}
                      onChangeText={setBusinessDescription}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.previewText}>
                    <Text style={styles.previewTitle}>Almost done!</Text>
                    <Text style={styles.previewSubtitle}>
                      Your business profile will help create professional estimates that match your brand
                    </Text>
                  </View>
                </Animated.View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#6C5CE7" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
          
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        
        {renderProgressIndicator()}
        {renderContent()}
        
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, isSubmitting && styles.disabledButton]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#6C5CE7', '#8E5CE7']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step < 6 ? 'Continue' : 'Get Started'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 10,
  },
  emptySpace: {
    width: 44,
    height: 44,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: '100%',
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    width: '100%',
    marginBottom: 18,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  uploadButtonContainer: {
    width: width - 80,
    height: 200,
    marginTop: 20,
  },
  uploadButton: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: width - 80,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  changeButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeButtonText: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  previewText: {
    marginTop: 25,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});