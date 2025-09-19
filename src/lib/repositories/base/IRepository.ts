import { PaginationOptions, PaginatedResult, FilterOptions } from '@/lib/services/base/IService';

/**
 * Base repository interface for CRUD operations
 */
export interface IRepository<T, CreateData, UpdateData> {
  /**
   * Repository name for logging and debugging
   */
  readonly repositoryName: string;

  /**
   * Find entity by ID
   */
  findById(id: string, include?: any): Promise<T | null>;

  /**
   * Find multiple entities with optional filtering and pagination
   */
  findMany(
    filters?: FilterOptions,
    pagination?: PaginationOptions,
    include?: any
  ): Promise<PaginatedResult<T>>;

  /**
   * Find first entity matching criteria
   */
  findFirst(filters: FilterOptions, include?: any): Promise<T | null>;

  /**
   * Create new entity
   */
  create(data: CreateData): Promise<T>;

  /**
   * Update entity by ID
   */
  update(id: string, data: UpdateData): Promise<T | null>;

  /**
   * Delete entity by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count entities matching criteria
   */
  count(filters?: FilterOptions): Promise<number>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Repository error types
 */
export enum RepositoryErrorType {
  NOT_FOUND = 'NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
}

/**
 * Custom repository error class
 */
export class RepositoryError extends Error {
  constructor(
    public readonly type: RepositoryErrorType,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Database transaction interface
 */
export interface ITransaction {
  // Prisma transaction type will be used in implementation
  [key: string]: any;
}

/**
 * Repository with transaction support
 */
export interface ITransactionalRepository<T, CreateData, UpdateData>
  extends IRepository<T, CreateData, UpdateData> {
  /**
   * Execute operations within a transaction
   */
  withTransaction<R>(
    operation: (tx: any) => Promise<R>
  ): Promise<R>;
}