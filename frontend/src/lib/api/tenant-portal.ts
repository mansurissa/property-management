import { apiClient } from '../api-client';

export interface TenantUnit {
  id: string;
  unitNumber: string;
  rentAmount: number;
  property: {
    name: string;
    address: string;
    city: string;
  };
}

export interface TenantProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leaseStart: string;
  leaseEnd: string;
  unit: TenantUnit;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  periodMonth: number;
  periodYear: number;
  status: string;
  unit?: {
    unitNumber: string;
    property?: {
      name: string;
    };
  };
}

export interface MaintenanceTicket {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  unit?: {
    unitNumber: string;
    property?: {
      name: string;
      address?: string;
    };
  };
  assignee?: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface DashboardData {
  profile: TenantProfile;
  unit: TenantUnit;
  property: {
    name: string;
    address: string;
    city: string;
  };
  currentMonthPaid: boolean;
  rentAmount: number;
  totalPaid: number;
  recentPayments: Payment[];
  maintenanceTickets: MaintenanceTicket[];
  currentPeriod: {
    month: number;
    year: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const tenantPortalApi = {
  // Get dashboard data
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardData }>('/tenant-portal/dashboard');
    return response.data.data;
  },

  // Get tenant profile with unit info
  getProfile: async (): Promise<TenantProfile> => {
    const response = await apiClient.get<{ success: boolean; data: TenantProfile }>('/tenant-portal/profile');
    return response.data.data;
  },

  // Get payment history
  getPayments: async (page = 1, limit = 10): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<{ success: boolean; data: Payment[]; pagination: any }>(
      `/tenant-portal/payments?page=${page}&limit=${limit}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  // Get maintenance tickets
  getMaintenanceTickets: async (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<MaintenanceTicket>> => {
    let url = `/tenant-portal/maintenance?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;

    const response = await apiClient.get<{ success: boolean; data: MaintenanceTicket[]; pagination: any }>(url);
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },

  // Get single maintenance ticket
  getMaintenanceTicket: async (id: string): Promise<MaintenanceTicket> => {
    const response = await apiClient.get<{ success: boolean; data: MaintenanceTicket }>(`/tenant-portal/maintenance/${id}`);
    return response.data.data;
  },

  // Create maintenance ticket
  createMaintenanceTicket: async (data: {
    category: string;
    description: string;
    priority?: string;
  }): Promise<MaintenanceTicket> => {
    const response = await apiClient.post<{ success: boolean; data: MaintenanceTicket; message: string }>(
      '/tenant-portal/maintenance',
      data
    );
    return response.data.data;
  }
};
