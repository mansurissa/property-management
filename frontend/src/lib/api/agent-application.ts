import { apiClient } from '../api-client';

export interface AgentApplicationData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId?: string;
  address?: string;
  city?: string;
  motivation?: string;
  experience?: string;
}

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
}

export const agentApplicationApi = {
  // Submit a new application (public)
  submit: async (data: AgentApplicationData): Promise<{ id: string; status: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { id: string; email: string; status: string; createdAt: string };
    }>('/agent-applications', data);
    return (response.data as any).data;
  },

  // Check application status (public)
  checkStatus: async (email: string): Promise<AgentApplication> => {
    const response = await apiClient.get<{
      success: boolean;
      data: AgentApplication;
    }>(`/agent-applications/status/${encodeURIComponent(email)}`);
    return (response.data as any).data;
  }
};
