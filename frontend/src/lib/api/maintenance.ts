import { apiClient } from '../api-client';

export interface MaintenanceTicket {
  id: string;
  unitId: string;
  tenantId?: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    property?: {
      id: string;
      name: string;
      address: string;
    };
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
}

export interface CreateMaintenanceData {
  unitId: string;
  tenantId?: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'other';
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateMaintenanceData {
  category?: 'plumbing' | 'electrical' | 'structural' | 'appliance' | 'other';
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface MaintenanceFilters {
  status?: string;
  priority?: string;
  unitId?: string;
}

export const maintenanceApi = {
  getAll: async (filters?: MaintenanceFilters): Promise<MaintenanceTicket[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.unitId) params.append('unitId', filters.unitId);

    const queryString = params.toString();
    const response = await apiClient.get(`/maintenance${queryString ? `?${queryString}` : ''}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<MaintenanceTicket> => {
    const response = await apiClient.get(`/maintenance/${id}`);
    return response.data.data;
  },

  create: async (data: CreateMaintenanceData): Promise<MaintenanceTicket> => {
    const response = await apiClient.post('/maintenance', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateMaintenanceData): Promise<MaintenanceTicket> => {
    const response = await apiClient.put(`/maintenance/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}`);
  }
};
