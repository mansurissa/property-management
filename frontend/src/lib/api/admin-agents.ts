import { apiClient } from '../api-client';

// Types
export interface AgentApplication {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId?: string;
  address?: string;
  city?: string;
  motivation?: string;
  experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  totalEarned: number;
  pendingEarnings: number;
  transactionCount: number;
}

export interface AgentDetails extends Agent {
  application?: AgentApplication;
  earnings: {
    totalEarned: number;
    pendingEarnings: number;
    paidEarnings: number;
    commissionCount: number;
  };
}

export interface AgentTransaction {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
  targetUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  commission?: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface AgentCommission {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  transaction?: {
    id: string;
    actionType: string;
    description: string;
    createdAt: string;
  };
}

// API methods
export const adminAgentsApi = {
  // Applications
  getApplications: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    applications: AgentApplication[];
    pagination: { total: number; page: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        applications: AgentApplication[];
        pagination: { total: number; page: number; pages: number };
      };
    }>(`/admin/agents/applications?${searchParams.toString()}`);
    return response.data.data;
  },

  getApplication: async (id: string): Promise<AgentApplication> => {
    const response = await apiClient.get<{
      success: boolean;
      data: AgentApplication;
    }>(`/admin/agents/applications/${id}`);
    return response.data.data;
  },

  approveApplication: async (id: string): Promise<{
    application: AgentApplication;
    user: { id: string; email: string; firstName: string; lastName: string };
    temporaryPassword: string;
  }> => {
    const response = await apiClient.put<{
      success: boolean;
      data: {
        application: AgentApplication;
        user: { id: string; email: string; firstName: string; lastName: string };
        temporaryPassword: string;
      };
    }>(`/admin/agents/applications/${id}/approve`);
    return response.data.data;
  },

  rejectApplication: async (id: string, reason?: string): Promise<AgentApplication> => {
    const response = await apiClient.put<{
      success: boolean;
      data: AgentApplication;
    }>(`/admin/agents/applications/${id}/reject`, { reason });
    return response.data.data;
  },

  // Agents
  getAgents: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    agents: Agent[];
    pagination: { total: number; page: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        agents: Agent[];
        pagination: { total: number; page: number; pages: number };
      };
    }>(`/admin/agents?${searchParams.toString()}`);
    return response.data.data;
  },

  getAgent: async (id: string): Promise<AgentDetails> => {
    const response = await apiClient.get<{
      success: boolean;
      data: AgentDetails;
    }>(`/admin/agents/${id}`);
    return response.data.data;
  },

  suspendAgent: async (id: string): Promise<void> => {
    await apiClient.put<{ success: boolean }>(`/admin/agents/${id}/suspend`);
  },

  activateAgent: async (id: string): Promise<void> => {
    await apiClient.put<{ success: boolean }>(`/admin/agents/${id}/activate`);
  },

  resetAgentPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    const response = await apiClient.put<{
      success: boolean;
      data: { temporaryPassword: string };
    }>(`/admin/agents/${id}/reset-password`);
    return response.data.data;
  },

  getAgentTransactions: async (id: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: AgentTransaction[];
    pagination: { total: number; page: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        transactions: AgentTransaction[];
        pagination: { total: number; page: number; pages: number };
      };
    }>(`/admin/agents/${id}/transactions?${searchParams.toString()}`);
    return response.data.data;
  },

  getAgentCommissions: async (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    commissions: AgentCommission[];
    pagination: { total: number; page: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        commissions: AgentCommission[];
        pagination: { total: number; page: number; pages: number };
      };
    }>(`/admin/agents/${id}/commissions?${searchParams.toString()}`);
    return response.data.data;
  },

  payCommission: async (commissionId: string, notes?: string): Promise<void> => {
    await apiClient.put<{ success: boolean }>(
      `/admin/agents/commissions/${commissionId}/pay`,
      { notes }
    );
  }
};
