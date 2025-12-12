import { Response } from 'express';

// Standard API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// Default pagination settings
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from query string
 */
export const parsePagination = (query: any): PaginationParams => {
  let page = parseInt(query.page as string) || DEFAULT_PAGE;
  let limit = parseInt(query.limit as string) || DEFAULT_LIMIT;

  // Enforce bounds
  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  pagination: PaginationParams,
  message?: string
): Response => {
  const meta = createPaginationMeta(total, pagination.page, pagination.limit);

  const response: PaginatedResponse<T[]> = {
    success: true,
    data: items,
    pagination: meta
  };

  if (message) {
    response.message = message;
  }

  return res.status(200).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: string[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send not found error (404)
 */
export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized error (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Authentication required'
): Response => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden error (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'You do not have permission to access this resource'
): Response => {
  return sendError(res, message, 403);
};

/**
 * Send validation error (422)
 */
export const sendValidationError = (
  res: Response,
  errors: string[],
  message: string = 'Validation failed'
): Response => {
  return sendError(res, message, 422, errors);
};

/**
 * Send conflict error (409)
 */
export const sendConflict = (
  res: Response,
  message: string
): Response => {
  return sendError(res, message, 409);
};

/**
 * Send server error (500)
 */
export const sendServerError = (
  res: Response,
  error?: Error,
  message: string = 'An unexpected error occurred'
): Response => {
  if (error) {
    console.error('Server error:', error);
  }
  return sendError(res, message, 500);
};

/**
 * Send delete success response
 */
export const sendDeleted = (
  res: Response,
  message: string = 'Deleted successfully'
): Response => {
  return res.status(200).json({
    success: true,
    message
  });
};
