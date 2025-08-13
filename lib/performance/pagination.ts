import { SQL, sql } from 'drizzle-orm';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export class Paginator {
  
  static validateAndNormalize(options: PaginationOptions = {}): PaginationParams {
    const {
      page = 1,
      limit = options.defaultLimit || 20,
      maxLimit = 100,
    } = options;

    // Validate and normalize page
    const normalizedPage = Math.max(1, Math.floor(page));
    
    // Validate and normalize limit
    const normalizedLimit = Math.min(
      Math.max(1, Math.floor(limit)), 
      maxLimit
    );

    // Calculate offset
    const offset = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset,
    };
  }

  static buildPaginationResult<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginationResult<T> {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? page + 1 : null,
        previousPage: hasPreviousPage ? page - 1 : null,
      },
    };
  }

  static generatePageLinks(
    baseUrl: string,
    params: PaginationParams,
    total: number,
    additionalParams: Record<string, any> = {}
  ): {
    first: string;
    last: string;
    next: string | null;
    previous: string | null;
    self: string;
  } {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    
    const buildUrl = (pageNum: number) => {
      const urlParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        ...additionalParams,
      });
      return `${baseUrl}?${urlParams.toString()}`;
    };

    return {
      first: buildUrl(1),
      last: buildUrl(totalPages),
      next: page < totalPages ? buildUrl(page + 1) : null,
      previous: page > 1 ? buildUrl(page - 1) : null,
      self: buildUrl(page),
    };
  }
}

export class CursorPaginator {
  
  static encodeCursor(data: Record<string, any>): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  static decodeCursor(cursor: string): Record<string, any> | null {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      return null;
    }
  }

  static buildCursorCondition(
    cursor: string | undefined,
    cursorField: string,
    direction: 'forward' | 'backward' = 'forward'
  ): SQL | undefined {
    if (!cursor) return undefined;

    const cursorData = this.decodeCursor(cursor);
    if (!cursorData || !cursorData[cursorField]) return undefined;

    const operator = direction === 'forward' ? '>' : '<';
    return sql`${sql.identifier(cursorField)} ${sql.raw(operator)} ${cursorData[cursorField]}`;
  }

  static buildCursorPaginationResult<T extends Record<string, any>>(
    data: T[],
    limit: number,
    cursorField: string,
    direction: 'forward' | 'backward' = 'forward'
  ): CursorPaginationResult<T> {
    const hasNextPage = data.length > limit;
    const hasPreviousPage = direction === 'backward' || data.length === limit;
    
    // Remove extra item if we fetched limit + 1
    const resultData = hasNextPage ? data.slice(0, limit) : data;
    
    let nextCursor: string | null = null;
    let previousCursor: string | null = null;

    if (resultData.length > 0) {
      if (hasNextPage) {
        const lastItem = resultData[resultData.length - 1];
        nextCursor = this.encodeCursor({ [cursorField]: lastItem[cursorField] });
      }
      
      if (hasPreviousPage) {
        const firstItem = resultData[0];
        previousCursor = this.encodeCursor({ [cursorField]: firstItem[cursorField] });
      }
    }

    return {
      data: resultData,
      pagination: {
        nextCursor,
        previousCursor,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    };
  }
}

// Database-specific pagination helpers
export class DatabasePagination {
  
  static async paginateQuery<T>(
    query: any, // Drizzle query builder
    countQuery: any, // Count query
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const params = Paginator.validateAndNormalize(options);
    
    // Execute count and data queries in parallel
    const [countResult, data] = await Promise.all([
      countQuery,
      query.limit(params.limit).offset(params.offset),
    ]);

    const total = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0].count 
      : 0;

    return Paginator.buildPaginationResult(data, total, params);
  }

  static async paginateWithCursor<T extends Record<string, any>>(
    query: any, // Drizzle query builder
    options: CursorPaginationOptions & { cursorField: string }
  ): Promise<CursorPaginationResult<T>> {
    const { cursor, limit = 20, direction = 'forward', cursorField } = options;
    
    // Add cursor condition if provided
    let modifiedQuery = query;
    if (cursor) {
      const cursorCondition = CursorPaginator.buildCursorCondition(
        cursor, 
        cursorField, 
        direction
      );
      if (cursorCondition) {
        modifiedQuery = modifiedQuery.where(cursorCondition);
      }
    }

    // Fetch one extra item to determine if there's a next page
    const data = await modifiedQuery.limit(limit + 1);

    return CursorPaginator.buildCursorPaginationResult(
      data, 
      limit, 
      cursorField, 
      direction
    );
  }
}

// Search-specific pagination
export class SearchPagination {
  
  static async paginateSearchResults<T>(
    searchFn: (offset: number, limit: number) => Promise<{ results: T[]; total: number }>,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const params = Paginator.validateAndNormalize(options);
    
    const { results, total } = await searchFn(params.offset, params.limit);
    
    return Paginator.buildPaginationResult(results, total, params);
  }

  static buildSearchMetadata(
    query: string,
    total: number,
    executionTime: number,
    filters?: Record<string, any>
  ) {
    return {
      query,
      total,
      executionTime,
      filters: filters || {},
      timestamp: new Date().toISOString(),
    };
  }
}

// Optimized pagination for large datasets
export class OptimizedPagination {
  
  // Use LIMIT/OFFSET with performance optimizations
  static async efficientOffsetPagination<T>(
    query: any,
    countQuery: any,
    options: PaginationOptions & {
      indexedColumn?: string;
      cacheKey?: string;
      cacheTtl?: number;
    } = {}
  ): Promise<PaginationResult<T>> {
    const params = Paginator.validateAndNormalize(options);
    
    // For large offsets, use a different strategy
    if (params.offset > 10000) {
      console.warn(`Large offset detected (${params.offset}). Consider using cursor pagination.`);
    }

    // Cache count query for expensive operations
    let total: number;
    if (options.cacheKey) {
      const { dbCache } = await import('./cache-manager');
      
      total = await dbCache.getQueryResult(
        `count:${options.cacheKey}`,
        async () => {
          const countResult = await countQuery;
          return Array.isArray(countResult) && countResult.length > 0 
            ? countResult[0].count 
            : 0;
        },
        options.cacheTtl || 300 // 5 minutes default
      );
    } else {
      const countResult = await countQuery;
      total = Array.isArray(countResult) && countResult.length > 0 
        ? countResult[0].count 
        : 0;
    }

    // Optimize query with indexed column
    let dataQuery = query;
    if (options.indexedColumn && params.offset > 0) {
      // Use indexed column for better performance on large offsets
      dataQuery = dataQuery.orderBy(sql.identifier(options.indexedColumn));
    }

    const data = await dataQuery.limit(params.limit).offset(params.offset);
    
    return Paginator.buildPaginationResult(data, total, params);
  }

  // Keyset pagination (most efficient for large datasets)
  static async keysetPagination<T extends Record<string, any>>(
    query: any,
    options: {
      lastValue?: any;
      keyColumn: string;
      limit?: number;
      direction?: 'asc' | 'desc';
    }
  ): Promise<{
    data: T[];
    nextPageKey: any;
    hasNextPage: boolean;
  }> {
    const { lastValue, keyColumn, limit = 20, direction = 'asc' } = options;
    
    let modifiedQuery = query;
    
    if (lastValue !== undefined) {
      const operator = direction === 'asc' ? '>' : '<';
      modifiedQuery = modifiedQuery.where(
        sql`${sql.identifier(keyColumn)} ${sql.raw(operator)} ${lastValue}`
      );
    }

    // Fetch one extra item to check for next page
    const data = await modifiedQuery
      .orderBy(
        direction === 'asc' 
          ? sql`${sql.identifier(keyColumn)} ASC`
          : sql`${sql.identifier(keyColumn)} DESC`
      )
      .limit(limit + 1);

    const hasNextPage = data.length > limit;
    const resultData = hasNextPage ? data.slice(0, limit) : data;
    const nextPageKey = hasNextPage ? data[limit - 1][keyColumn] : null;

    return {
      data: resultData,
      nextPageKey,
      hasNextPage,
    };
  }
}

// Infinite scroll pagination
export class InfiniteScrollPagination {
  
  static async loadMore<T>(
    loadFn: (cursor?: string, limit?: number) => Promise<CursorPaginationResult<T>>,
    currentData: T[],
    cursor?: string,
    limit: number = 20
  ): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const result = await loadFn(cursor, limit);
    
    return {
      data: [...currentData, ...result.data],
      nextCursor: result.pagination.nextCursor,
      hasMore: result.pagination.hasNextPage,
    };
  }

  static buildInfiniteScrollResponse<T>(
    data: T[],
    nextCursor: string | null,
    hasMore: boolean
  ) {
    return {
      data,
      nextCursor,
      hasMore,
      count: data.length,
    };
  }
}

// Virtual pagination for UI components
export class VirtualPagination {
  
  static calculateVisibleRange(
    scrollTop: number,
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan: number = 5
  ): {
    startIndex: number;
    endIndex: number;
    visibleItems: number;
  } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);

    return {
      startIndex,
      endIndex,
      visibleItems,
    };
  }

  static calculateScrollbarProps(
    totalItems: number,
    itemHeight: number,
    containerHeight: number,
    scrollTop: number
  ): {
    scrollbarHeight: number;
    scrollbarTop: number;
  } {
    const totalHeight = totalItems * itemHeight;
    const scrollbarHeight = Math.max(
      20, 
      (containerHeight / totalHeight) * containerHeight
    );
    const scrollbarTop = (scrollTop / totalHeight) * containerHeight;

    return {
      scrollbarHeight,
      scrollbarTop,
    };
  }
}

// Utility functions for URL-based pagination
export class PaginationUrlHelper {
  
  static buildPaginationUrls(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    limit: number,
    additionalParams: Record<string, string> = {}
  ) {
    const buildUrl = (page: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...additionalParams,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      first: totalPages > 0 ? buildUrl(1) : null,
      previous: currentPage > 1 ? buildUrl(currentPage - 1) : null,
      next: currentPage < totalPages ? buildUrl(currentPage + 1) : null,
      last: totalPages > 0 ? buildUrl(totalPages) : null,
    };
  }

  static parsePaginationFromUrl(url: string): PaginationParams {
    const urlObj = new URL(url);
    const page = parseInt(urlObj.searchParams.get('page') || '1');
    const limit = parseInt(urlObj.searchParams.get('limit') || '20');

    return Paginator.validateAndNormalize({ page, limit });
  }
}

// Export commonly used functions
export {
  Paginator,
  CursorPaginator,
  DatabasePagination,
  SearchPagination,
  OptimizedPagination,
  InfiniteScrollPagination,
  VirtualPagination,
  PaginationUrlHelper,
};