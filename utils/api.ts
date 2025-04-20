// api.ts
import axios from 'axios';
import { getUserEmail } from './userStore';

const API_BASE_URL = 'http://192.168.56.64:8000/api'; // Replace with your actual API URL

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User Profile API
export const UserProfileAPI = {
  async getProfile(): Promise<any> {
    const email = await getUserEmail();
    if (!email) throw new Error('No email found');
    
    const response = await api.get(`/user-profile/?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  async updateProfile(profileData: any): Promise<any> {
    const email = await getUserEmail();
    if (!email) throw new Error('No email found');
    
    const response = await api.put(`/user-profile/`, { ...profileData, email });
    return response.data;
  },

  async deleteAccount(): Promise<any>{
    const email = await getUserEmail();
    if(!email) throw new Error('No email found')

    const response = await api.post('/delete-account/', {email});
    return response.data;
  }
};

// Business Profile API
export const BusinessProfileAPI = {
  async getBusinessProfile(): Promise<any> {
    const email = await getUserEmail();
    if (!email) throw new Error('No email found');
    
    const response = await api.get(`/business-profile/?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  async updateBusinessProfile(businessData: any): Promise<any> {
    const email = await getUserEmail();
    if (!email) throw new Error('No email found');
    
    const response = await api.put(`/business-profile/`, { ...businessData, email });
    return response.data;
  }
};


// Add interceptors for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    }
    console.error('Network Error:', error.message);
    return Promise.reject({ error: 'Network error' });
  }
);