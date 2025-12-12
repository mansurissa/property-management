import { apiClient } from '../api-client';

export interface DemoRequestData {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  numberOfProperties?: string;
  message?: string;
}

export interface DemoRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string | null;
  numberOfProperties: string | null;
  message: string | null;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  scheduledAt: string | null;
  contactedAt: string | null;
  contactedBy: string | null;
  contactedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DemoRequestStats {
  pending: number;
  contacted: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  total: number;
  recentCount: number;
}

export const demoRequestsApi = {
  // Public - Submit demo request
  submit: async (data: DemoRequestData): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/demo-requests', data);
    return response.data as { success: boolean; message: string };
  },

  // Admin - Get all demo requests
  getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<{
    data: DemoRequest[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const response = await apiClient.get(`/demo-requests/admin${query ? `?${query}` : ''}`);
    return response.data as {
      data: DemoRequest[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    };
  },

  // Admin - Get stats
  getStats: async (): Promise<DemoRequestStats> => {
    const response = await apiClient.get('/demo-requests/admin/stats');
    return (response.data as any).data;
  },

  // Admin - Update demo request
  update: async (id: string, data: { status?: string; notes?: string; scheduledAt?: string }): Promise<DemoRequest> => {
    const response = await apiClient.put(`/demo-requests/admin/${id}`, data);
    return (response.data as any).data;
  },

  // Admin - Delete demo request
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/demo-requests/admin/${id}`);
  }
};
