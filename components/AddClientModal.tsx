import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';




type Client = {
  name: string;
  phone: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddClient: (client: Client) => void;
};

const AddClientModal: React.FC<Props> = ({
  visible = false,
  onClose = () => {},
  onAddClient = (client: Client) => {},
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [countryCode, setCountryCode] = useState<CountryCode>('GH');
  const [callingCode, setCallingCode] = useState('233'); // Ghana's default
  const allowedCountries: CountryCode[] = ['GH', 'NG', 'US', 'GB', 'DE']; // Ghana, Nigeria, USA, UK, Germany
  
  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]); // First code if multiple
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setNameError('');
    setPhoneError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateInputs = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Client name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    return isValid;
  };

  const handleAddClient = () => {
    if (validateInputs()) {
      console.log("Adding client:", { name, phone }); // Debug log
      onAddClient({ name, phone });
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Add New Client</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Client Name</Text>
                  <View style={[styles.inputContainer, nameError ? styles.inputError : null]}>
                    <MaterialIcons name="person" size={20} color="#A0AEC0" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter client's full name"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (text.trim()) setNameError('');
                      }}
                      style={styles.input}
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
                    <CountryPicker
                        countryCode={countryCode}
                        withFilter
                        withFlag
                        withCallingCode
                        withEmoji
                        onSelect={onSelect}
                        countryCodes={allowedCountries} 
                        containerButtonStyle={{ marginRight: 8 }}
                    />
                    <Text style={{ color: '#1E293B', marginRight: 6 }}>+{callingCode}</Text>
                    <TextInput
                        placeholder="Enter phone number"
                        value={phone}
                        onChangeText={(text) => {
                        setPhone(text);
                        if (text.trim()) setPhoneError('');
                        }}
                        keyboardType="phone-pad"
                        style={styles.input}
                        placeholderTextColor="#A0AEC0"
                    />
                    </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                </View>
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.saveButton} onPress={handleAddClient}>
                  <LinearGradient
                    colors={['#6C5CE7', '#8E5CE7']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Client</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
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
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  form: {
    padding: 24,
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    height: '100%',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 8,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddClientModal;