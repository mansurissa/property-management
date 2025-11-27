import { apiClient } from '../api-client';

export interface DashboardOverview {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalTenants: number;
  activeTenants: number;
  lateTenants: number;
  totalRevenue: number;
  pendingMaintenance: number;
}

export interface DashboardStats {
  overview: DashboardOverview;
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    createdAt: string;
    tenant: {
      firstName: string;
      lastName: string;
    };
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
  }>;
  recentMaintenance: Array<{
    id: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    createdAt: string;
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
  }>;
  currentPeriod: {
    month: number;
    year: number;
  };
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  }
};
