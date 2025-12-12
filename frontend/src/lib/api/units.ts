import { apiClient } from '../api-client';
import { Unit } from './properties';

export interface CreateUnitData {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent: number;
  paymentDueDay?: number;
}

export interface UpdateUnitData {
  unitNumber?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent?: number;
  paymentDueDay?: number;
  status?: 'vacant' | 'occupied' | 'maintenance';
}

export const unitsApi = {
  getByProperty: async (propertyId: string): Promise<Unit[]> => {
    const response = await apiClient.get(`/units/property/${propertyId}`);
    return (response.data as any).data;
  },

  getById: async (id: string): Promise<Unit> => {
    const response = await apiClient.get(`/units/${id}`);
    return (response.data as any).data;
  },

  create: async (data: CreateUnitData): Promise<Unit> => {
    const response = await apiClient.post('/units', data);
    return (response.data as any).data;
  },

  update: async (id: string, data: UpdateUnitData): Promise<Unit> => {
    const response = await apiClient.put(`/units/${id}`, data);
    return (response.data as any).data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/units/${id}`);
  }
};
