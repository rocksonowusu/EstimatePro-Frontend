import axios from 'axios';
import {saveUserEmail} from '../utils/userStore'

// Set your Django backend base URL (adjust if needed)
const BASE_URL = 'http://192.168.56.64:8000/api';

// Define an interface for the onboarding data
export interface OnboardingData {
  email: string;
  name: string;
  phone: string;
  address: string;
  website?: string;
  taxId?: string;
  established?: string;
  industry?: string;
  description?: string;
  // The letterhead image file should include a uri, type, and name
  letterhead?: {
    uri: string;
    type?: string;
    name?: string;
  };
}

// Function to submit onboarding data
export const submitOnboarding = async (data: OnboardingData): Promise<any> => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('name', data.name);
  formData.append('phone', data.phone);
  formData.append('address', data.address);
  if (data.website) formData.append('website', data.website);
  if (data.taxId) formData.append('taxId', data.taxId);
  if (data.established) formData.append('established', data.established);
  if (data.industry) formData.append('industry', data.industry);
  if (data.description) formData.append('description', data.description);

  // If a letterhead image is provided, append it to the form data.
  if (data.letterhead) {
    // Note: In Expo, your file object should include uri, type, and name.
    formData.append('image', {
      uri: data.letterhead.uri,
      type: data.letterhead.type || 'image/jpeg',
      name: data.letterhead.name || 'letterhead.jpg',
    } as any);
  }

  try {
    const response = await axios.post(`${BASE_URL}/onboarding/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
      // Save the email after successful onboarding
      await saveUserEmail(data.email);    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to fetch onboarding details by email
export const getOnboarding = async (email: string): Promise<any> => {
  try {
    const response = await axios.get(`${BASE_URL}/onboarding/?email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
