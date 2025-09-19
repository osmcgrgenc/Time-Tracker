import { logger } from '@/lib/logger';
import {
  IService,
  ServiceResult,
  ServiceError,
  ServiceErrorType,
  PaginationOptions,
  PaginatedResult,
  FilterOptions,
} from './IService';

/**
 * Abstract base service class providing common functionality
 * All service classes should extend this base class
 */
export abstract class BaseService implements IService {
  abstract readonly serviceName: string;

  /**
   * Creates a successful service result
   */
  protected createSuccessResult<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Creates an error service result
   */
  protected createErrorResult(
    error: string,
    details?: any
  ): ServiceResult<never> {
    return {
      success: false,
      error,
      details,
    };
  }

  /**
   * Handles service errors and converts them to ServiceResult
   */
  protected handleError(error: unknown): ServiceResult<never> {
    if (error instanceof ServiceError) {
      logger.error(`${this.serviceName} - Service Error:`, undefined, {
        errorType: error.type,
        message: error.message,
        details: error.details,
      });
      return this.createErrorResult(error.message, error.details);
    }

    if (error instanceof Error) {
      logger.error(`${this.serviceName} - Unexpected Error:`, error);
      return this.createErrorResult('Internal server error');
    }

    logger.error(`${this.serviceName} - Unknown Error:`, undefined, {
      errorValue: String(error),
    });
    return this.createErrorResult('Unknown error occurred');
  }

  /**
   * Executes a service operation with error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>
  ): Promise<ServiceResult<T>> {
    try {
      const result = await operation();
      return this.createSuccessResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validates required fields
   */
  protected validateRequired(
    data: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(
      (field) => data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      throw new ServiceError(
        ServiceErrorType.VALIDATION_ERROR,
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields }
      );
    }
  }

  /**
   * Creates pagination options with defaults
   */
  protected createPaginationOptions(
    options?: PaginationOptions
  ): Required<PaginationOptions> {
    return {
      page: options?.page ?? 1,
      limit: Math.min(options?.limit ?? 10, 100), // Max 100 items per page
      sortBy: options?.sortBy ?? 'createdAt',
      sortOrder: options?.sortOrder ?? 'desc',
    };
  }

  /**
   * Creates paginated result
   */
  protected createPaginatedResult<T>(
    items: T[],
    total: number,
    pagination: Required<PaginationOptions>
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Logs service operation
   */
  protected logOperation(
    operation: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    logger.info(`${this.serviceName} - ${operation}`, {
      userId,
      ...metadata,
    });
  }
}