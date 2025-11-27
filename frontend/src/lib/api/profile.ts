import { apiClient } from '../api-client';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationalId?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Role-specific stats
  propertiesOwned?: number;
  propertiesManaged?: number;
  transactionCount?: number;
  totalEarned?: number;
  totalPending?: number;
  totalPaid?: number;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationalId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  // Get current user's profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/profile/change-password', data);
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/profile');
    return response.data;
  }
};
