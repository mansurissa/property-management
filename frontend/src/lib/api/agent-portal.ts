import { apiClient } from '../api-client';

// Types
export interface AgentDashboard {
  earnings: AgentEarnings;
  pendingCommissionsCount: number;
  recentTransactions: AgentTransaction[];
  actionTypes: Record<string, string>;
}

export interface AgentEarnings {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  transactionCount: number;
  commissionCount: number;
}

export interface AgentTransaction {
  id: string;
  agentId: string;
  actionType: string;
  targetUserType: 'owner' | 'tenant';
  targetUserId?: string;
  targetTenantId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  description?: string;
  metadata?: any;
  transactionAmount?: number;
  createdAt: string;
  targetUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  targetTenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  commission?: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface AgentCommission {
  id: string;
  agentId: string;
  transactionId: string;
  commissionRuleId?: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  notes?: string;
  createdAt: string;
  transaction?: {
    actionType: string;
    description: string;
    createdAt: string;
  };
}

export interface AgentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  createdAt: string;
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  transactionCount: number;
  commissionCount: number;
}

export interface Owner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface TenantSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  unit?: {
    id: string;
    unitNumber: string;
    property?: {
      id: string;
      name: string;
    };
  };
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  units?: {
    id: string;
    unitNumber: string;
    status: string;
    monthlyRent: number;
  }[];
}

// API methods
export const agentPortalApi = {
  // Dashboard
  getDashboard: async (): Promise<AgentDashboard> => {
    const response = await apiClient.get<{ success: boolean; data: AgentDashboard }>(
      '/agent-portal/dashboard'
    );
    return response.data.data;
  },

  // Transactions
  getTransactions: async (page = 1, limit = 20): Promise<{
    transactions: AgentTransaction[];
    total: number;
    pages: number;
  }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { transactions: AgentTransaction[]; total: number; pages: number };
    }>(`/agent-portal/transactions?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Earnings
  getEarnings: async (startDate?: string, endDate?: string): Promise<{
    summary: AgentEarnings;
    commissions: AgentCommission[];
  }> => {
    let url = '/agent-portal/earnings';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await apiClient.get<{
      success: boolean;
      data: { summary: AgentEarnings; commissions: AgentCommission[] };
    }>(url);
    return response.data.data;
  },

  // Profile
  getProfile: async (): Promise<AgentProfile> => {
    const response = await apiClient.get<{ success: boolean; data: AgentProfile }>(
      '/agent-portal/profile'
    );
    return response.data.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      '/agent-portal/profile',
      data
    );
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put<{ success: boolean; message: string }>(
      '/agent-portal/change-password',
      data
    );
  },

  // Search
  searchOwners: async (search?: string): Promise<Owner[]> => {
    const response = await apiClient.get<{ success: boolean; data: Owner[] }>(
      `/agent-portal/owners${search ? `?search=${encodeURIComponent(search)}` : ''}`
    );
    return response.data.data;
  },

  searchTenants: async (search?: string): Promise<TenantSearchResult[]> => {
    const response = await apiClient.get<{ success: boolean; data: TenantSearchResult[] }>(
      `/agent-portal/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`
    );
    return response.data.data;
  },

  // Owner assistance
  getOwnerProperties: async (ownerId: string): Promise<Property[]> => {
    const response = await apiClient.get<{ success: boolean; data: Property[] }>(
      `/agent-portal/owner/${ownerId}/properties`
    );
    return response.data.data;
  },

  getOwnerTenants: async (ownerId: string): Promise<TenantSearchResult[]> => {
    const response = await apiClient.get<{ success: boolean; data: TenantSearchResult[] }>(
      `/agent-portal/owner/${ownerId}/tenants`
    );
    return response.data.data;
  },

  createPropertyForOwner: async (data: {
    ownerId: string;
    name: string;
    address: string;
    city: string;
    type?: string;
  }): Promise<{ property: any; commission: { amount: number; status: string } | null }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { property: any; commission: { amount: number; status: string } | null };
    }>('/agent-portal/assist-owner/property', data);
    return response.data.data;
  },

  updatePropertyForOwner: async (propertyId: string, data: {
    name?: string;
    address?: string;
    city?: string;
    type?: string;
  }): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/agent-portal/assist-owner/property/${propertyId}`,
      data
    );
    return response.data.data;
  },

  addTenantForOwner: async (data: {
    ownerId: string;
    unitId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    nationalId?: string;
    leaseStart: string;
    leaseEnd: string;
    rentAmount: number;
  }): Promise<{ tenant: any; commission: { amount: number; status: string } | null }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { tenant: any; commission: { amount: number; status: string } | null };
    }>('/agent-portal/assist-owner/tenant', data);
    return response.data.data;
  },

  recordPaymentForOwner: async (data: {
    ownerId: string;
    tenantId: string;
    unitId: string;
    amount: number;
    paymentMethod?: string;
    paymentDate: string;
    periodMonth: number;
    periodYear: number;
    notes?: string;
  }): Promise<{ payment: any; commission: { amount: number; status: string } | null }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { payment: any; commission: { amount: number; status: string } | null };
    }>('/agent-portal/assist-owner/payment', data);
    return response.data.data;
  },

  // Tenant assistance
  updateTenantInfo: async (tenantId: string, data: {
    phone?: string;
    email?: string;
  }): Promise<any> => {
    const response = await apiClient.put<{ success: boolean; data: any }>(
      `/agent-portal/assist-tenant/${tenantId}/info`,
      data
    );
    return response.data.data;
  },

  recordPaymentForTenant: async (tenantId: string, data: {
    amount: number;
    paymentMethod?: string;
    paymentDate: string;
    periodMonth: number;
    periodYear: number;
    notes?: string;
  }): Promise<{ payment: any; commission: { amount: number; status: string } | null }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { payment: any; commission: { amount: number; status: string } | null };
    }>(`/agent-portal/assist-tenant/${tenantId}/payment`, data);
    return response.data.data;
  },

  submitMaintenanceForTenant: async (tenantId: string, data: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
  }): Promise<{ ticket: any; commission: { amount: number; status: string } | null }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { ticket: any; commission: { amount: number; status: string } | null };
    }>(`/agent-portal/assist-tenant/${tenantId}/maintenance`, data);
    return response.data.data;
  }
};
