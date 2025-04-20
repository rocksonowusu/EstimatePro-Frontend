import axios from 'axios';

// Set the base URL for your Django backend API
const API_BASE_URL = 'http://192.168.56.64:8000/api';

// Define the interfaces for estimate item and estimate data
// Note: The 'description' field holds the material description that will appear in your "Description of Materials" column.
// If the user selects a material from your predefined list, you can populate this field automatically.
// Alternatively, if the user types in their own material description, just use that text.
export interface EstimateItem {
  description: string; // This is the description shown to the user.
  quantity: number;
  unit_price: number;
  amount: number;
  // This optional field can be used to track if a predefined material was selected.
  // If the material is typed in manually, you can ignore this field.
  chosen_material_id?: number;
}

export interface EstimateData {
  user_email: string; // Used by backend to look up the UserProfile
  client_name: string;
  estimate_title: string;
  notes: string;
  workmanship: string;
  total_materials: string;
  grand_total: string;
  items: EstimateItem[];
}

export interface Estimate{
  id:number;
  client_name:string;
  estimate_title:string;
  notes:string;
  workmanship:string;
  total_materials: string;
  grand_total: string;
  created_at:string;
  items:EstimateItem[];
  status:string;
}

//function to fetch all estimates
export const getAllEstimates = async (): Promise<Estimate[]> =>{
  try{
    const response = await axios.get(`${API_BASE_URL}/all-estimates/`);
    return response.data;
  }catch(error){
    throw error
  }
}

// Function to create an estimate by sending a POST request with JSON data
export const createEstimate = async (data: EstimateData): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/estimates/`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get the PDF preview for a given estimate ID.
// Here, we set the responseType to 'blob' so that we receive binary data.
export const downloadEstimatePreview = async (estimateId: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/estimates/${estimateId}/preview/`, {
      responseType: 'blob',  // Ensures the binary data is handled correctly
    });
    return response.data; // The blob can then be saved or passed to a native viewer
  } catch (error) {
    throw error;
  }
};

// (Optional) Define an interface for material descriptions for autocomplete
export interface MaterialDescription {
  id: number;
  name: string;
  unit: string;
}

// Function to retrieve a list of predefined material descriptions from the backend.
// The frontend can display this list to let the user choose a material, and then automatically fill in the description field.
export const getMaterialDescriptions = async (): Promise<MaterialDescription[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/material-desciptions/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
