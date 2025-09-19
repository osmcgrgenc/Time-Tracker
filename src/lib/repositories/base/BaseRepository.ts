import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import {
  IRepository,
  ITransactionalRepository,
  ITransaction,
  RepositoryError,
  RepositoryErrorType,
} from './IRepository';
import {
  PaginationOptions,
  PaginatedResult,
  FilterOptions,
} from '@/lib/services/base/IService';

/**
 * Abstract base repository class providing common database operations
 */
export abstract class BaseRepository<T, CreateData, UpdateData>
  implements ITransactionalRepository<T, CreateData, UpdateData>
{
  abstract readonly repositoryName: string;
  protected abstract readonly model: any; // Prisma model delegate

  /**
   * Find entity by ID
   */
  async findById(id: string, include?: any): Promise<T | null> {
    try {
      this.logOperation('findById', { id });
      const result = await this.model.findUnique({
        where: { id },
        include,
      });
      return result;
    } catch (error) {
      this.handleError('findById', error);
      throw error;
    }
  }

  /**
   * Find multiple entities with filtering and pagination
   */
  async findMany(
    filters: FilterOptions = {},
    pagination?: PaginationOptions,
    include?: any
  ): Promise<PaginatedResult<T>> {
    try {
      this.logOperation('findMany', { filters, pagination });

      const paginationOptions = this.createPaginationOptions(pagination);
      const where = this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause(paginationOptions);

      const [items, total] = await Promise.all([
        this.model.findMany({
          where,
          include,
          orderBy,
          skip: (paginationOptions.page - 1) * paginationOptions.limit,
          take: paginationOptions.limit,
        }),
        this.model.count({ where }),
      ]);

      return {
        items,
        total,
        page: paginationOptions.page,
        limit: paginationOptions.limit,
        totalPages: Math.ceil(total / paginationOptions.limit),
      };
    } catch (error) {
      this.handleError('findMany', error);
      throw error;
    }
  }

  /**
   * Find first entity matching criteria
   */
  async findFirst(filters: FilterOptions, include?: any): Promise<T | null> {
    try {
      this.logOperation('findFirst', { filters });
      const where = this.buildWhereClause(filters);
      const result = await this.model.findFirst({
        where,
        include,
      });
      return result;
    } catch (error) {
      this.handleError('findFirst', error);
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: CreateData): Promise<T> {
    try {
      this.logOperation('create', { data });
      const result = await this.model.create({
        data,
      });
      return result;
    } catch (error) {
      this.handleError('create', error);
      throw error;
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: UpdateData): Promise<T | null> {
    try {
      this.logOperation('update', { id, data });
      const result = await this.model.update({
        where: { id },
        data,
      });
      return result;
    } catch (error) {
      if (this.isPrismaNotFoundError(error)) {
        return null;
      }
      this.handleError('update', error);
      throw error;
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logOperation('delete', { id });
      await this.model.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (this.isPrismaNotFoundError(error)) {
        return false;
      }
      this.handleError('delete', error);
      throw error;
    }
  }

  /**
   * Count entities matching criteria
   */
  async count(filters: FilterOptions = {}): Promise<number> {
    try {
      this.logOperation('count', { filters });
      const where = this.buildWhereClause(filters);
      const result = await this.model.count({ where });
      return result;
    } catch (error) {
      this.handleError('count', error);
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.model.findUnique({
        where: { id },
        select: { id: true },
      });
      return result !== null;
    } catch (error) {
      this.handleError('exists', error);
      throw error;
    }
  }

  /**
   * Execute operations within a transaction
   */
  async withTransaction<R>(
    operation: (tx: any) => Promise<R>
  ): Promise<R> {
    try {
      this.logOperation('withTransaction');
      return await db.$transaction(operation);
    } catch (error) {
      this.handleError('withTransaction', error);
      throw error;
    }
  }

  /**
   * Build where clause from filters
   */
  protected buildWhereClause(filters: FilterOptions): any {
    // Override in child classes for specific filtering logic
    return filters;
  }

  /**
   * Build order by clause from pagination options
   */
  protected buildOrderByClause(
    pagination: Required<PaginationOptions>
  ): any {
    return {
      [pagination.sortBy]: pagination.sortOrder,
    };
  }

  /**
   * Create pagination options with defaults
   */
  protected createPaginationOptions(
    options?: PaginationOptions
  ): Required<PaginationOptions> {
    return {
      page: options?.page ?? 1,
      limit: Math.min(options?.limit ?? 10, 100),
      sortBy: options?.sortBy ?? 'createdAt',
      sortOrder: options?.sortOrder ?? 'desc',
    };
  }

  /**
   * Check if error is Prisma not found error
   */
  protected isPrismaNotFoundError(error: any): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  /**
   * Handle repository errors
   */
  protected handleError(operation: string, error: any): void {
    logger.error(`${this.repositoryName} - ${operation} Error:`, {
      message: error.message,
      ...(error.code && { code: error.code }),
      ...(error.stack && { stack: error.stack }),
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new RepositoryError(
            RepositoryErrorType.CONSTRAINT_VIOLATION,
            'Unique constraint violation',
            error.meta
          );
        case 'P2025':
          throw new RepositoryError(
            RepositoryErrorType.NOT_FOUND,
            'Record not found',
            error.meta
          );
        default:
          throw new RepositoryError(
            RepositoryErrorType.QUERY_ERROR,
            error.message,
            error.meta
          );
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      throw new RepositoryError(
        RepositoryErrorType.CONNECTION_ERROR,
        'Database connection error',
        error.message
      );
    }
  }

  /**
   * Log repository operation
   */
  protected logOperation(
    operation: string,
    metadata?: Record<string, any>
  ): void {
    logger.debug(`${this.repositoryName} - ${operation}`, metadata);
  }
}