// Base API Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
  code?: string;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  timeout?: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  permissions?: Record<string, boolean>;
}

export type UserRole = 'super_admin' | 'agency' | 'owner' | 'manager' | 'tenant' | 'maintenance' | 'agent';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

// Generic API Endpoints
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
