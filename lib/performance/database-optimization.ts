import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

// Database performance monitoring and optimization
export class DatabaseOptimization {
  
  // Query performance monitoring
  static async analyzeQueryPerformance(
    queryName: string,
    queryFn: () => Promise<any>
  ): Promise<{
    result: any;
    executionTime: number;
    memoryUsage: number;
  }> {
    const startTime = performance.now();
    const initialMemory = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const finalMemory = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      const executionTime = endTime - startTime;
      const memoryUsage = finalMemory - initialMemory;
      
      // Log slow queries
      if (executionTime > 1000) { // 1 second threshold
        console.warn(`Slow query detected: ${queryName}`, {
          executionTime: `${executionTime.toFixed(2)}ms`,
          memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        });
      }
      
      return { result, executionTime, memoryUsage };
      
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      console.error(`Query failed: ${queryName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: `${executionTime.toFixed(2)}ms`,
      });
      
      throw error;
    }
  }

  // Index management and recommendations
  static async analyzeIndexUsage(): Promise<{
    unusedIndexes: Array<{ table: string; index: string; size: string }>;
    missingIndexes: Array<{ query: string; recommendation: string }>;
    duplicateIndexes: Array<{ table: string; indexes: string[] }>;
  }> {
    // PostgreSQL-specific index analysis
    const unusedIndexes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      WHERE idx_scan = 0
      AND schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
    `);

    const duplicateIndexes = await db.execute(sql`
      SELECT 
        tablename,
        array_agg(indexname) as indexes
      FROM pg_indexes
      WHERE schemaname = 'public'
      GROUP BY tablename, indexdef
      HAVING count(*) > 1
    `);

    // Analyze slow queries to suggest missing indexes
    const slowQueries = await this.getSlowQueries();
    const missingIndexes = this.analyzeMissingIndexes(slowQueries);

    return {
      unusedIndexes: unusedIndexes.rows as any[],
      missingIndexes,
      duplicateIndexes: duplicateIndexes.rows as any[],
    };
  }

  // Get slow queries from pg_stat_statements
  private static async getSlowQueries(): Promise<Array<{
    query: string;
    mean_exec_time: number;
    calls: number;
  }>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          query,
          mean_exec_time,
          calls
        FROM pg_stat_statements
        WHERE mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `);
      
      return result.rows as any[];
    } catch (error) {
      // pg_stat_statements extension might not be installed
      console.warn('pg_stat_statements not available for slow query analysis');
      return [];
    }
  }

  // Analyze queries to suggest missing indexes
  private static analyzeMissingIndexes(slowQueries: Array<{
    query: string;
    mean_exec_time: number;
    calls: number;
  }>): Array<{ query: string; recommendation: string }> {
    const recommendations: Array<{ query: string; recommendation: string }> = [];
    
    slowQueries.forEach(({ query }) => {
      // Simple pattern matching for common scenarios
      if (query.includes('WHERE') && !query.includes('INDEX')) {
        // Extract WHERE conditions
        const whereMatch = query.match(/WHERE\s+([^ORDER|GROUP|LIMIT|;]+)/i);
        if (whereMatch) {
          const conditions = whereMatch[1];
          
          // Look for unindexed column filters
          const columnMatches = conditions.match(/(\w+)\s*=\s*/g);
          if (columnMatches) {
            columnMatches.forEach(match => {
              const column = match.replace(/\s*=\s*/, '');
              recommendations.push({
                query: query.substring(0, 100) + '...',
                recommendation: `Consider adding index on column: ${column}`,
              });
            });
          }
        }
      }
      
      if (query.includes('ORDER BY') && query.includes('LIMIT')) {
        const orderByMatch = query.match(/ORDER BY\s+([^LIMIT|;]+)/i);
        if (orderByMatch) {
          const orderColumn = orderByMatch[1].trim();
          recommendations.push({
            query: query.substring(0, 100) + '...',
            recommendation: `Consider adding index for ORDER BY: ${orderColumn}`,
          });
        }
      }
    });
    
    return recommendations;
  }

  // Create database indexes programmatically
  static async createIndex(
    tableName: string,
    columns: string[],
    options: {
      name?: string;
      unique?: boolean;
      partial?: string;
      method?: 'btree' | 'hash' | 'gin' | 'gist';
    } = {}
  ): Promise<void> {
    const {
      name = `idx_${tableName}_${columns.join('_')}`,
      unique = false,
      partial,
      method = 'btree',
    } = options;

    let createIndexSql = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX CONCURRENTLY IF NOT EXISTS ${name}`;
    createIndexSql += ` ON ${tableName} USING ${method}`;
    createIndexSql += ` (${columns.join(', ')})`;
    
    if (partial) {
      createIndexSql += ` WHERE ${partial}`;
    }

    try {
      await db.execute(sql.raw(createIndexSql));
      console.log(`Created index: ${name}`);
    } catch (error) {
      console.error(`Failed to create index ${name}:`, error);
      throw error;
    }
  }

  // Connection pool optimization
  static async optimizeConnectionPool(): Promise<{
    activeConnections: number;
    idleConnections: number;
    maxConnections: number;
    recommendations: string[];
  }> {
    const connectionStats = await db.execute(sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    const maxConnections = await db.execute(sql`
      SELECT setting::int as max_connections
      FROM pg_settings
      WHERE name = 'max_connections'
    `);

    const stats = connectionStats.rows[0] as any;
    const maxConn = maxConnections.rows[0] as any;
    
    const recommendations: string[] = [];
    
    if (stats.active_connections > maxConn.max_connections * 0.8) {
      recommendations.push('Consider increasing max_connections or using connection pooling');
    }
    
    if (stats.idle_connections > stats.active_connections * 2) {
      recommendations.push('High number of idle connections detected. Consider reducing connection pool size');
    }

    return {
      activeConnections: stats.active_connections,
      idleConnections: stats.idle_connections,
      maxConnections: maxConn.max_connections,
      recommendations,
    };
  }

  // Table maintenance and optimization
  static async performTableMaintenance(tableName: string): Promise<void> {
    console.log(`Starting maintenance for table: ${tableName}`);
    
    try {
      // Analyze table statistics
      await db.execute(sql.raw(`ANALYZE ${tableName}`));
      console.log(`Analyzed table: ${tableName}`);
      
      // Vacuum table (reclaim space)
      await db.execute(sql.raw(`VACUUM ${tableName}`));
      console.log(`Vacuumed table: ${tableName}`);
      
      // Reindex table
      await db.execute(sql.raw(`REINDEX TABLE ${tableName}`));
      console.log(`Reindexed table: ${tableName}`);
      
    } catch (error) {
      console.error(`Table maintenance failed for ${tableName}:`, error);
      throw error;
    }
  }

  // Query optimization suggestions
  static async getQueryOptimizationSuggestions(): Promise<Array<{
    category: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    implementation: string;
  }>> {
    const suggestions = [];
    
    // Check for missing indexes
    const indexAnalysis = await this.analyzeIndexUsage();
    
    if (indexAnalysis.missingIndexes.length > 0) {
      suggestions.push({
        category: 'Indexing',
        suggestion: `Create ${indexAnalysis.missingIndexes.length} missing indexes`,
        impact: 'high' as const,
        implementation: 'Use DatabaseOptimization.createIndex() method',
      });
    }

    if (indexAnalysis.unusedIndexes.length > 0) {
      suggestions.push({
        category: 'Indexing',
        suggestion: `Remove ${indexAnalysis.unusedIndexes.length} unused indexes`,
        impact: 'medium' as const,
        implementation: 'DROP INDEX for unused indexes',
      });
    }

    // Check connection pool
    const connectionStats = await this.optimizeConnectionPool();
    if (connectionStats.recommendations.length > 0) {
      suggestions.push({
        category: 'Connection Pool',
        suggestion: connectionStats.recommendations.join('; '),
        impact: 'medium' as const,
        implementation: 'Adjust database connection pool settings',
      });
    }

    // Check table sizes and suggest partitioning
    const largeTables = await this.findLargeTables();
    if (largeTables.length > 0) {
      suggestions.push({
        category: 'Partitioning',
        suggestion: `Consider partitioning large tables: ${largeTables.map(t => t.table).join(', ')}`,
        impact: 'high' as const,
        implementation: 'Implement table partitioning strategy',
      });
    }

    return suggestions;
  }

  // Find large tables that might benefit from partitioning
  private static async findLargeTables(): Promise<Array<{
    table: string;
    size: string;
    rows: number;
  }>> {
    const result = await db.execute(sql`
      SELECT 
        tablename as table,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_tup_ins + n_tup_upd + n_tup_del as rows
      FROM pg_tables t
      LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
      WHERE schemaname = 'public'
      AND pg_total_relation_size(schemaname||'.'||tablename) > 100 * 1024 * 1024 -- > 100MB
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    return result.rows as any[];
  }
}

// Query builder with performance optimizations
export class OptimizedQueryBuilder {
  
  // Build optimized pagination query
  static buildPaginatedQuery(
    baseQuery: any,
    page: number,
    limit: number,
    orderBy?: string
  ) {
    const offset = (page - 1) * limit;
    
    let query = baseQuery;
    
    if (orderBy) {
      query = query.orderBy(sql.raw(orderBy));
    }
    
    // For large offsets, warn about performance
    if (offset > 10000) {
      console.warn(`Large offset (${offset}) may cause performance issues. Consider cursor-based pagination.`);
    }
    
    return query.limit(limit).offset(offset);
  }

  // Build optimized search query with full-text search
  static buildSearchQuery(
    table: any,
    searchColumns: string[],
    searchTerm: string,
    options: {
      fuzzySearch?: boolean;
      rank?: boolean;
      highlights?: boolean;
    } = {}
  ) {
    const { fuzzySearch = false, rank = false, highlights = false } = options;
    
    if (searchColumns.length === 0) {
      throw new Error('At least one search column must be specified');
    }

    // Build full-text search condition
    const searchCondition = searchColumns
      .map(col => {
        if (fuzzySearch) {
          return sql`${sql.identifier(col)} ILIKE ${'%' + searchTerm + '%'}`;
        } else {
          return sql`to_tsvector('english', ${sql.identifier(col)}) @@ plainto_tsquery('english', ${searchTerm})`;
        }
      })
      .reduce((acc, condition) => acc ? sql`${acc} OR ${condition}` : condition);

    let query = table.where(searchCondition);

    // Add ranking if requested
    if (rank && !fuzzySearch) {
      const rankExpression = searchColumns
        .map(col => sql`ts_rank(to_tsvector('english', ${sql.identifier(col)}), plainto_tsquery('english', ${searchTerm}))`)
        .reduce((acc, rank) => acc ? sql`${acc} + ${rank}` : rank);
      
      query = query
        .select({ '*': sql`*`, rank: rankExpression })
        .orderBy(sql`rank DESC`);
    }

    return query;
  }

  // Build query with optimized joins
  static buildOptimizedJoin(
    leftTable: any,
    rightTable: any,
    joinCondition: any,
    selectFields?: string[]
  ) {
    let query = leftTable.leftJoin(rightTable, joinCondition);
    
    // Select only necessary fields to reduce data transfer
    if (selectFields && selectFields.length > 0) {
      const selectObj = selectFields.reduce((acc, field) => {
        acc[field] = sql.identifier(field);
        return acc;
      }, {} as Record<string, any>);
      
      query = query.select(selectObj);
    }
    
    return query;
  }
}

// Database health monitoring
export class DatabaseHealthMonitor {
  
  static async getHealthMetrics(): Promise<{
    connectionHealth: {
      active: number;
      idle: number;
      total: number;
      maxConnections: number;
    };
    performanceMetrics: {
      averageQueryTime: number;
      slowQueries: number;
      queryCount: number;
    };
    storageMetrics: {
      databaseSize: string;
      tableCount: number;
      indexCount: number;
    };
    replicationHealth?: {
      replicationLag: number;
      replicaStatus: string;
    };
  }> {
    const [connectionHealth, performanceMetrics, storageMetrics] = await Promise.all([
      this.getConnectionHealth(),
      this.getPerformanceMetrics(),
      this.getStorageMetrics(),
    ]);

    return {
      connectionHealth,
      performanceMetrics,
      storageMetrics,
    };
  }

  private static async getConnectionHealth() {
    const result = await db.execute(sql`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    return result.rows[0] as any;
  }

  private static async getPerformanceMetrics() {
    try {
      const result = await db.execute(sql`
        SELECT 
          avg(mean_exec_time) as average_query_time,
          count(*) FILTER (WHERE mean_exec_time > 1000) as slow_queries,
          sum(calls) as query_count
        FROM pg_stat_statements
      `);

      return result.rows[0] as any;
    } catch {
      // pg_stat_statements not available
      return {
        average_query_time: 0,
        slow_queries: 0,
        query_count: 0,
      };
    }
  }

  private static async getStorageMetrics() {
    const result = await db.execute(sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as index_count
    `);

    return result.rows[0] as any;
  }

  static async checkDatabaseLocks(): Promise<Array<{
    blocked_query: string;
    blocking_query: string;
    blocked_duration: string;
  }>> {
    const result = await db.execute(sql`
      SELECT 
        blocked_locks.query as blocked_query,
        blocking_locks.query as blocking_query,
        now() - blocked_locks.query_start as blocked_duration
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.GRANTED
    `);

    return result.rows as any[];
  }
}

// Automated database maintenance scheduler
export class DatabaseMaintenanceScheduler {
  private static maintenanceInterval: NodeJS.Timeout | null = null;

  static startScheduledMaintenance(intervalHours: number = 24): void {
    if (this.maintenanceInterval) {
      this.stopScheduledMaintenance();
    }

    this.maintenanceInterval = setInterval(async () => {
      await this.runMaintenanceTasks();
    }, intervalHours * 60 * 60 * 1000);

    console.log(`Database maintenance scheduled every ${intervalHours} hours`);
  }

  static stopScheduledMaintenance(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
      console.log('Database maintenance scheduler stopped');
    }
  }

  private static async runMaintenanceTasks(): Promise<void> {
    console.log('Starting scheduled database maintenance...');

    try {
      // Update table statistics
      await db.execute(sql`ANALYZE`);
      
      // Vacuum all tables
      await db.execute(sql`VACUUM`);
      
      // Check for unused indexes
      const optimization = new DatabaseOptimization();
      const indexAnalysis = await optimization.analyzeIndexUsage();
      
      if (indexAnalysis.unusedIndexes.length > 0) {
        console.log(`Found ${indexAnalysis.unusedIndexes.length} unused indexes`);
      }
      
      console.log('Scheduled database maintenance completed');
    } catch (error) {
      console.error('Scheduled database maintenance failed:', error);
    }
  }
}