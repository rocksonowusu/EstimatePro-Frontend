import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing user email
const USER_EMAIL_KEY = '@app_user_email';

// Save user email to AsyncStorage
export const saveUserEmail = async (email: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
    console.log('Email saved to local storage:', email);
  } catch (error) {
    console.error('Error saving email to storage:', error);
    throw error;
  }
};

// Get user email from AsyncStorage
export const getUserEmail = async (): Promise<string | null> => {
  try {
    const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
    return email;
  } catch (error) {
    console.error('Error getting email from storage:', error);
    return null;
  }
};

// Clear user email (for logout)
export const clearUserEmail = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_EMAIL_KEY);
  } catch (error) {
    console.error('Error clearing email from storage:', error);
    throw error;
  }
};