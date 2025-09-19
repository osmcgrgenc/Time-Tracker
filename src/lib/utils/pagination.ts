export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

/**
 * Parse and validate pagination parameters from request
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): Required<PaginationParams> {
  const {
    defaultLimit = 20,
    maxLimit = 100,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
  } = options;

  // Parse page
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  // Parse limit
  let limit = parseInt(searchParams.get('limit') || defaultLimit.toString(), 10);
  limit = Math.min(Math.max(1, limit), maxLimit);

  // Parse sorting
  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultSortOrder;

  // Parse search
  const search = searchParams.get('search') || '';

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationResult<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginationResult<T> {
  const pagination = calculatePagination(total, params.page, params.limit);

  return {
    data,
    pagination,
    sorting: {
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  };
}

/**
 * Generate Prisma skip and take values
 */
export function getPrismaSkipTake(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take };
}

/**
 * Generate Prisma orderBy object
 */
export function getPrismaOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Record<string, 'asc' | 'desc'> {
  return { [sortBy]: sortOrder };
}

/**
 * Validate sort field against allowed fields
 */
export function validateSortField(
  sortBy: string,
  allowedFields: string[],
  defaultField: string = 'createdAt'
): string {
  return allowedFields.includes(sortBy) ? sortBy : defaultField;
}

/**
 * Generate search filter for Prisma
 */
export function generateSearchFilter(
  search: string,
  searchFields: string[]
): any {
  if (!search.trim()) {
    return {};
  }

  const searchConditions = searchFields.map(field => ({
    [field]: {
      contains: search,
      mode: 'insensitive' as const,
    },
  }));

  return {
    OR: searchConditions,
  };
}

/**
 * Pagination helper for database queries
 */
export class PaginationHelper {
  private params: Required<PaginationParams>;
  private options: PaginationOptions;

  constructor(searchParams: URLSearchParams, options: PaginationOptions = {}) {
    this.params = parsePaginationParams(searchParams, options);
    this.options = options;
  }

  /**
   * Get pagination parameters
   */
  getParams(): Required<PaginationParams> {
    return this.params;
  }

  /**
   * Get Prisma skip and take
   */
  getPrismaSkipTake() {
    return getPrismaSkipTake(this.params.page, this.params.limit);
  }

  /**
   * Get Prisma orderBy with field validation
   */
  getPrismaOrderBy(allowedFields: string[], defaultField?: string) {
    const validSortBy = validateSortField(
      this.params.sortBy,
      allowedFields,
      defaultField || this.options.defaultSortBy
    );
    return getPrismaOrderBy(validSortBy, this.params.sortOrder);
  }

  /**
   * Get search filter
   */
  getSearchFilter(searchFields: string[]) {
    return generateSearchFilter(this.params.search, searchFields);
  }

  /**
   * Create paginated response
   */
  createResponse<T>(data: T[], total: number): PaginationResult<T> {
    return createPaginatedResponse(data, total, this.params);
  }
}

/**
 * Common pagination configurations
 */
export const PaginationConfigs = {
  // Default configuration
  default: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc' as const,
  },

  // Small page size for detailed data
  small: {
    defaultLimit: 10,
    maxLimit: 50,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc' as const,
  },

  // Large page size for simple data
  large: {
    defaultLimit: 50,
    maxLimit: 200,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc' as const,
  },

  // Time entries specific
  timeEntries: {
    defaultLimit: 30,
    maxLimit: 100,
    defaultSortBy: 'date',
    defaultSortOrder: 'desc' as const,
  },

  // Tasks specific
  tasks: {
    defaultLimit: 25,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc' as const,
  },
};