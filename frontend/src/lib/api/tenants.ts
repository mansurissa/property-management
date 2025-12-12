import { apiClient } from '../api-client';

export interface Tenant {
  id: string;
  unitId?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: 'active' | 'late' | 'exited';
  leaseStartDate?: string;
  leaseEndDate?: string;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    monthlyRent: number;
    property?: {
      id: string;
      name: string;
      address: string;
    };
  };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  paymentMethod: 'cash' | 'momo' | 'bank';
  paymentDate: string;
  periodMonth: number;
  periodYear: number;
  notes?: string;
  createdAt: string;
}

export interface CreateTenantData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  unitId?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
}

export interface UpdateTenantData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status?: 'active' | 'late' | 'exited';
  leaseStartDate?: string;
  leaseEndDate?: string;
}

export const tenantsApi = {
  getAll: async (status?: string): Promise<Tenant[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/tenants${params}`);
    return (response.data as any).data;
  },

  getById: async (id: string): Promise<Tenant> => {
    const response = await apiClient.get(`/tenants/${id}`);
    return (response.data as any).data;
  },

  create: async (data: CreateTenantData): Promise<Tenant> => {
    const response = await apiClient.post('/tenants', data);
    return (response.data as any).data;
  },

  update: async (id: string, data: UpdateTenantData): Promise<Tenant> => {
    const response = await apiClient.put(`/tenants/${id}`, data);
    return (response.data as any).data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tenants/${id}`);
  },

  assign: async (id: string, unitId: string): Promise<Tenant> => {
    const response = await apiClient.post(`/tenants/${id}/assign`, { unitId });
    return (response.data as any).data;
  },

  unassign: async (id: string): Promise<Tenant> => {
    const response = await apiClient.post(`/tenants/${id}/unassign`);
    return (response.data as any).data;
  }
};
