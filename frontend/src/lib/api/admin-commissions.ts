import { apiClient } from '../api-client';

// Types
export interface CommissionRule {
  id: string;
  actionType: string;
  actionTypeLabel?: string;
  name: string;
  description?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ActionType {
  value: string;
  label: string;
}

export interface CommissionReports {
  totalCommissions: number;
  totalPending: number;
  totalPaid: number;
  byAgent: {
    agent: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    total: number;
    pending: number;
    paid: number;
    count: number;
  }[];
  byActionType: {
    actionType: string;
    label: string;
    total: number;
    count: number;
  }[];
}

export interface Commission {
  id: string;
  agentId: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  agent?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  transaction?: {
    id: string;
    actionType: string;
    description: string;
    createdAt: string;
  };
  rule?: {
    id: string;
    name: string;
    actionType: string;
  };
}

export interface CreateCommissionRuleData {
  actionType: string;
  name: string;
  description?: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  isActive?: boolean;
}

export interface UpdateCommissionRuleData {
  name?: string;
  description?: string;
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive?: boolean;
}

// API methods
export const adminCommissionsApi = {
  // Rules
  getRules: async (): Promise<CommissionRule[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: CommissionRule[];
    }>('/admin/commissions/rules');
    return (response.data as any).data;
  },

  getRule: async (id: string): Promise<CommissionRule> => {
    const response = await apiClient.get<{
      success: boolean;
      data: CommissionRule;
    }>(`/admin/commissions/rules/${id}`);
    return (response.data as any).data;
  },

  createRule: async (data: CreateCommissionRuleData): Promise<CommissionRule> => {
    const response = await apiClient.post<{
      success: boolean;
      data: CommissionRule;
    }>('/admin/commissions/rules', data);
    return (response.data as any).data;
  },

  updateRule: async (id: string, data: UpdateCommissionRuleData): Promise<CommissionRule> => {
    const response = await apiClient.put<{
      success: boolean;
      data: CommissionRule;
    }>(`/admin/commissions/rules/${id}`, data);
    return (response.data as any).data;
  },

  deleteRule: async (id: string): Promise<void> => {
    await apiClient.delete<{ success: boolean }>(`/admin/commissions/rules/${id}`);
  },

  getActionTypes: async (): Promise<ActionType[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ActionType[];
    }>('/admin/commissions/action-types');
    return (response.data as any).data;
  },

  // Reports
  getReports: async (startDate?: string, endDate?: string): Promise<CommissionReports> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{
      success: boolean;
      data: CommissionReports;
    }>(`/admin/commissions/reports?${params.toString()}`);
    return (response.data as any).data;
  },

  // Commissions
  getCommissions: async (params?: {
    status?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    commissions: Commission[];
    pagination: { total: number; page: number; pages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.agentId) searchParams.append('agentId', params.agentId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: {
        commissions: Commission[];
        pagination: { total: number; page: number; pages: number };
      };
    }>(`/admin/commissions?${searchParams.toString()}`);
    return (response.data as any).data;
  },

  payCommission: async (id: string, notes?: string): Promise<void> => {
    await apiClient.put<{ success: boolean }>(
      `/admin/commissions/${id}/pay`,
      { notes }
    );
  },

  payBulkCommissions: async (commissionIds: string[], notes?: string): Promise<void> => {
    await apiClient.post<{ success: boolean }>(
      '/admin/commissions/pay-bulk',
      { commissionIds, notes }
    );
  }
};
