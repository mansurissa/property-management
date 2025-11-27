import { apiClient } from '../api-client';

export interface Property {
  id: string;
  userId: string;
  name: string;
  type: 'apartment' | 'house' | 'commercial' | 'other';
  address: string;
  city: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  paymentDueDay: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
  };
}

export interface CreatePropertyData {
  name: string;
  type?: string;
  address: string;
  city?: string;
  description?: string;
}

export interface UpdatePropertyData {
  name?: string;
  type?: string;
  address?: string;
  city?: string;
  description?: string;
}

export const propertiesApi = {
  getAll: async (): Promise<Property[]> => {
    const response = await apiClient.get('/properties');
    return response.data.data;
  },

  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePropertyData): Promise<Property> => {
    const response = await apiClient.post('/properties', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdatePropertyData): Promise<Property> => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  }
};
