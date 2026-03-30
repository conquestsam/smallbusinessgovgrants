import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';

// Required for neon-serverless to work in Node.js environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

export interface ManagerConfig {
  maxRetries: number;
  retryDelay: number; // base delay in ms
  queryTimeout: number; // ms
  slowQueryThreshold: number; // ms
}

const DEFAULT_CONFIG: ManagerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  queryTimeout: 5000,
  slowQueryThreshold: 500,
};

class DatabaseManager {
  private pool: Pool | null = null;
  private config: ManagerConfig;
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30s

  constructor(config: Partial<ManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getPool(): Pool {
    if (!this.pool) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
      }
      this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      this.pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
        this.handleFailure();
      });
    }
    return this.pool;
  }

  private handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.circuitBreakerState = 'open';
      console.error('Database Circuit Breaker: OPEN');
    }
  }

  private resetBreaker() {
    this.failureCount = 0;
    this.circuitBreakerState = 'closed';
    console.log('Database Circuit Breaker: CLOSED');
  }

  private checkCircuit(): boolean {
    if (this.circuitBreakerState === 'open') {
      if (Date.now() - this.lastFailureTime > this.RECOVERY_TIMEOUT) {
        this.circuitBreakerState = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  async executeWithResilience<T>(operation: (db: any) => Promise<T>): Promise<T> {
    if (!this.checkCircuit()) {
      throw new Error('Database circuit breaker is currently OPEN');
    }

    let lastError: any;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const pool = this.getPool();
        const db = drizzle(pool, { schema });

        // Timeout wrapper
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query Timeout')), this.config.queryTimeout)
        );

        const result = await Promise.race([operation(db), timeoutPromise]) as T;

        const duration = Date.now() - startTime;
        if (duration > this.config.slowQueryThreshold) {
          console.warn(`Slow Query Detected: ${duration}ms`);
          // Here we could log to a database table or monitoring service
        }

        if (this.circuitBreakerState === 'half-open') {
          this.resetBreaker();
        }
        return result;

      } catch (error: any) {
        lastError = error;
        console.error(`Database attempt ${attempt} failed:`, error.message);
        
        if (error.message === 'Query Timeout' || attempt === this.config.maxRetries) {
          this.handleFailure();
        }

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  async shutdown() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export const dbManager = new DatabaseManager();
