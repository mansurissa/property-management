import { apiClient } from '../api-client';

export interface AdminOverview {
  totalUsers: number;
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingMaintenance: number;
}

export interface UserByRole {
  role: string;
  count: string;
}

export interface RecentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  overview: AdminOverview;
  usersByRole: UserByRole[];
  recentUsers: RecentUser[];
  currentPeriod: {
    month: number;
    year: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const adminApi = {
  // Get admin dashboard stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats');
    return (response.data as any).data;
  },

  // Get all users with pagination
  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<{
    data: AdminUser[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    const response = await apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
    return response.data as {
      data: AdminUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  },

  // Create a new user
  createUser: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
  }): Promise<AdminUser> => {
    const response = await apiClient.post('/admin/users', data);
    return (response.data as any).data;
  },

  // Update a user
  updateUser: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<AdminUser> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return (response.data as any).data;
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  // Get all agencies
  getAgencies: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/agencies');
    return (response.data as any).data;
  },

  // Get all owners
  getOwners: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/owners');
    return (response.data as any).data;
  }
};
