import { Prisma } from '@prisma/client';

/**
 * Query optimization utilities for better database performance
 */

/**
 * Optimized select fields for different models to reduce data transfer
 */
export const OptimizedSelects = {
  // User fields for different contexts
  user: {
    minimal: {
      id: true,
      name: true,
      email: true,
    },
    profile: {
      id: true,
      name: true,
      email: true,
      totalXP: true,
      level: true,
      preferences: true,
      isActive: true,
      lastActiveAt: true,
    },
    full: {
      id: true,
      name: true,
      email: true,
      clerkId: true,
      totalXP: true,
      level: true,
      preferences: true,
      isActive: true,
      lastActiveAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  // Project fields for different contexts
  project: {
    minimal: {
      id: true,
      name: true,
      color: true,
    },
    list: {
      id: true,
      name: true,
      description: true,
      color: true,
      client: true,
      archived: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    full: {
      id: true,
      name: true,
      description: true,
      color: true,
      client: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },

  // Task fields for different contexts
  task: {
    minimal: {
      id: true,
      title: true,
      completed: true,
      priority: true,
    },
    list: {
      id: true,
      title: true,
      description: true,
      completed: true,
      priority: true,
      dueDate: true,
      estimatedMinutes: true,
      actualMinutes: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    full: {
      id: true,
      title: true,
      description: true,
      completed: true,
      priority: true,
      dueDate: true,
      estimatedMinutes: true,
      actualMinutes: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          client: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },

  // Timer fields for different contexts
  timer: {
    minimal: {
      id: true,
      status: true,
      startTime: true,
      elapsedTime: true,
    },
    active: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      elapsedTime: true,
      totalPausedTime: true,
      description: true,
      billable: true,
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    full: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      elapsedTime: true,
      totalPausedTime: true,
      description: true,
      billable: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          client: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          priority: true,
        },
      },
    },
  },

  // TimeEntry fields for different contexts
  timeEntry: {
    list: {
      id: true,
      date: true,
      duration: true,
      description: true,
      billable: true,
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          client: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    full: {
      id: true,
      date: true,
      duration: true,
      description: true,
      billable: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
          client: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          priority: true,
        },
      },
    },
  },
};

/**
 * Common where clauses for filtering
 */
export const CommonFilters = {
  // Active users only
  activeUsers: {
    isActive: true,
  },

  // Non-archived projects
  activeProjects: {
    archived: false,
  },

  // Completed tasks
  completedTasks: {
    completed: true,
  },

  // Pending tasks
  pendingTasks: {
    completed: false,
  },

  // Recent items (last 30 days)
  recent: {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },

  // This week
  thisWeek: {
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  },

  // Today
  today: {
    createdAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  },
};

/**
 * Query builder for complex filters
 */
export class QueryBuilder {
  private where: any = {};
  private include: any = {};
  private select: any = {};
  private orderBy: any = {};

  /**
   * Add where condition
   */
  addWhere(condition: any): this {
    this.where = { ...this.where, ...condition };
    return this;
  }

  /**
   * Add date range filter
   */
  addDateRange(field: string, startDate?: Date, endDate?: Date): this {
    if (startDate || endDate) {
      this.where[field] = {};
      if (startDate) {
        this.where[field].gte = startDate;
      }
      if (endDate) {
        this.where[field].lte = endDate;
      }
    }
    return this;
  }

  /**
   * Add user filter
   */
  addUserFilter(userId: string): this {
    this.where.userId = userId;
    return this;
  }

  /**
   * Add project filter
   */
  addProjectFilter(projectId: string): this {
    this.where.projectId = projectId;
    return this;
  }

  /**
   * Add search filter
   */
  addSearch(searchFields: string[], searchTerm: string): this {
    if (searchTerm.trim()) {
      const searchConditions = searchFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        },
      }));
      
      this.where.OR = searchConditions;
    }
    return this;
  }

  /**
   * Set include relations
   */
  setInclude(include: any): this {
    this.include = include;
    return this;
  }

  /**
   * Set select fields
   */
  setSelect(select: any): this {
    this.select = select;
    return this;
  }

  /**
   * Set order by
   */
  setOrderBy(orderBy: any): this {
    this.orderBy = orderBy;
    return this;
  }

  /**
   * Build the final query object
   */
  build(): any {
    const query: any = {
      where: this.where,
    };

    if (Object.keys(this.include).length > 0) {
      query.include = this.include;
    }

    if (Object.keys(this.select).length > 0) {
      query.select = this.select;
    }

    if (Object.keys(this.orderBy).length > 0) {
      query.orderBy = this.orderBy;
    }

    return query;
  }
}

/**
 * Performance monitoring utilities
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  /**
   * Monitor query execution time
   */
  static async monitor<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      this.recordQuery(queryName, executionTime);
      
      // Log slow queries (> 1 second)
      if (executionTime > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }

  /**
   * Record query statistics
   */
  private static recordQuery(queryName: string, executionTime: number): void {
    const existing = this.queries.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count += 1;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queries.set(queryName, existing);
  }

  /**
   * Get query statistics
   */
  static getStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queries.entries());
  }

  /**
   * Reset statistics
   */
  static reset(): void {
    this.queries.clear();
  }
}

/**
 * Batch operation utilities
 */
export class BatchOperations {
  /**
   * Batch create with transaction
   */
  static async batchCreate<T>(
    prisma: any,
    model: string,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    const batches = this.chunkArray(data, batchSize);
    
    for (const batch of batches) {
      await prisma.$transaction(async (tx: any) => {
        await tx[model].createMany({
          data: batch,
          skipDuplicates: true,
        });
      });
    }
  }

  /**
   * Batch update with transaction
   */
  static async batchUpdate<T>(
    prisma: any,
    model: string,
    updates: Array<{ where: any; data: T }>,
    batchSize: number = 50
  ): Promise<void> {
    const batches = this.chunkArray(updates, batchSize);
    
    for (const batch of batches) {
      await prisma.$transaction(async (tx: any) => {
        const promises = batch.map(({ where, data }) =>
          tx[model].update({ where, data })
        );
        await Promise.all(promises);
      });
    }
  }

  /**
   * Chunk array into smaller arrays
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}