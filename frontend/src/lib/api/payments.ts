import { apiClient } from '../api-client';

export interface Payment {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  paymentMethod: 'cash' | 'momo' | 'bank';
  paymentDate: string;
  periodMonth: number;
  periodYear: number;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    monthlyRent: number;
    property?: {
      id: string;
      name: string;
    };
  };
}

export interface CreatePaymentData {
  tenantId: string;
  unitId: string;
  amount: number;
  paymentMethod?: 'cash' | 'momo' | 'bank';
  paymentDate: string;
  periodMonth: number;
  periodYear: number;
  notes?: string;
}

export interface PaymentFilters {
  tenantId?: string;
  unitId?: string;
  periodMonth?: number;
  periodYear?: number;
  startDate?: string;
  endDate?: string;
}

export interface TenantBalance {
  expectedTotal: number;
  paidTotal: number;
  balance: number;
  monthsOwed: number;
  monthlyRent: number;
}

export const paymentsApi = {
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.unitId) params.append('unitId', filters.unitId);
    if (filters?.periodMonth) params.append('periodMonth', filters.periodMonth.toString());
    if (filters?.periodYear) params.append('periodYear', filters.periodYear.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const response = await apiClient.get(`/payments${queryString ? `?${queryString}` : ''}`);
    return (response.data as any).data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return (response.data as any).data;
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await apiClient.post('/payments', data);
    return (response.data as any).data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
  },

  getTenantPayments: async (tenantId: string): Promise<Payment[]> => {
    const response = await apiClient.get(`/payments/tenant/${tenantId}`);
    return (response.data as any).data;
  },

  getTenantBalance: async (tenantId: string): Promise<TenantBalance> => {
    const response = await apiClient.get(`/payments/tenant/${tenantId}/balance`);
    return (response.data as any).data;
  }
};
