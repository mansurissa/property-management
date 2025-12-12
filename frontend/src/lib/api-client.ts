import { ApiResponse, ApiError, RequestConfig } from '@/types/api';
import { sessionManager } from '@/lib/session';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL!
  ) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionManager.getToken();
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, cache } = config;

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      cache
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestConfig);

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data?.message || data || 'An error occurred',
          status: response.status,
          details: data
        };
        throw error;
      }

      return {
        data,
        status: response.status,
        message: data?.message
      };
    } catch (error: any) {
      // If this is already an ApiError we threw (from !response.ok), re-throw it
      if (error && typeof error === 'object' && 'status' in error && error.status !== 0) {
        throw error as ApiError;
      }

      // Log the actual error for debugging
      console.error('API request failed:', url, error);

      throw {
        message:
          error instanceof Error ? error.message : 'Network error occurred',
        status: 0
      } as ApiError;
    }
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  // Special method for FormData uploads (doesn't add JSON Content-Type)
  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      ...headers
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method: 'POST',
      headers: requestHeaders,
      body: formData
    };

    try {
      const response = await fetch(url, requestConfig);

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data?.message || data || 'An error occurred',
          status: response.status,
          details: data
        };
        throw error;
      }

      return {
        data,
        status: response.status,
        message: data?.message
      };
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error as ApiError;
      }

      throw {
        message:
          error instanceof Error ? error.message : 'Network error occurred',
        status: 0
      } as ApiError;
    }
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }
}

export const apiClient = new ApiClient();
