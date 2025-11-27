import { apiClient } from '../api-client';

// Types
export interface ManagerProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  status: string;
  totalUnits: number;
  createdAt: string;
  permissions: ManagerPermissions;
  assignedAt: string;
  units?: ManagerUnit[];
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export interface ManagerPermissions {
  canViewTenants: boolean;
  canViewPayments: boolean;
  canViewMaintenance: boolean;
  canCreateMaintenance: boolean;
  canUpdateMaintenance: boolean;
}

export interface ManagerUnit {
  id: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  monthlyRent: number;
  status: string;
  paymentDueDay?: number;
}

export interface ManagerTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId?: string;
  status: string;
  leaseStart: string;
  leaseEnd: string;
  rentAmount: number;
  createdAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    monthlyRent: number;
  };
}

export interface ManagerPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    unit?: {
      id: string;
      unitNumber: string;
    };
  };
}

export interface ManagerMaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
  };
  assignedStaff?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ManagerDashboard {
  propertiesManaged: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  tenantCount: number;
  openMaintenanceTickets: number;
  paymentsThisMonth: {
    count: number;
    totalAmount: number;
  };
}

export interface ManagerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  createdAt: string;
  propertiesManaged: number;
}

// API methods
export const managerPortalApi = {
  // Dashboard
  getDashboard: async (): Promise<ManagerDashboard> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerDashboard }>(
      '/manager-portal/dashboard'
    );
    return response.data.data;
  },

  // Properties
  getProperties: async (): Promise<ManagerProperty[]> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerProperty[] }>(
      '/manager-portal/properties'
    );
    return response.data.data;
  },

  getPropertyById: async (propertyId: string): Promise<ManagerProperty> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerProperty }>(
      `/manager-portal/properties/${propertyId}`
    );
    return response.data.data;
  },

  // Tenants
  getPropertyTenants: async (propertyId: string): Promise<ManagerTenant[]> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerTenant[] }>(
      `/manager-portal/properties/${propertyId}/tenants`
    );
    return response.data.data;
  },

  // Payments
  getPropertyPayments: async (propertyId: string): Promise<ManagerPayment[]> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerPayment[] }>(
      `/manager-portal/properties/${propertyId}/payments`
    );
    return response.data.data;
  },

  // Maintenance
  getPropertyMaintenance: async (propertyId: string): Promise<ManagerMaintenanceTicket[]> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerMaintenanceTicket[] }>(
      `/manager-portal/properties/${propertyId}/maintenance`
    );
    return response.data.data;
  },

  // Profile
  getProfile: async (): Promise<ManagerProfile> => {
    const response = await apiClient.get<{ success: boolean; data: ManagerProfile }>(
      '/manager-portal/profile'
    );
    return response.data.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }): Promise<ManagerProfile> => {
    const response = await apiClient.put<{ success: boolean; data: ManagerProfile; message: string }>(
      '/manager-portal/profile',
      data
    );
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put<{ success: boolean; message: string }>(
      '/manager-portal/change-password',
      data
    );
  },

  deleteAccount: async (password: string): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/manager-portal/account`;
    const { sessionManager } = require('@/lib/session');
    const token = sessionManager.getToken();

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw { message: data.message || 'Failed to delete account', status: response.status };
    }
  }
};
