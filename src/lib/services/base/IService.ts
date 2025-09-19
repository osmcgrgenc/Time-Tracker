/**
 * Base interface for all service classes
 * Provides common service operations and error handling
 */
export interface IService {
  /**
   * Service name for logging and debugging
   */
  readonly serviceName: string;
}

/**
 * Base service result type for consistent API responses
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Service error types for better error handling
 */
export enum ServiceErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom service error class
 */
export class ServiceError extends Error {
  constructor(
    public readonly type: ServiceErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Filter options for search operations
 */
export interface FilterOptions {
  [key: string]: any;
}