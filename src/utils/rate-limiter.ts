/**
 * Rate Limiting Utility
 * Handles API rate limits with exponential backoff and proper error handling
 */

export interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 60000,
      backoffMultiplier: config.backoffMultiplier || 2
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (this.shouldRetry(error) && retryCount < this.config.maxRetries) {
        const delay = this.calculateDelay(retryCount);
        console.warn(`Rate limit hit for ${operationName}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`);
        
        await this.sleep(delay);
        return this.executeWithRetry(operation, operationName, retryCount + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Check for rate limiting errors
    if (error.status === 403 || error.status === 429) {
      return true;
    }
    
    // Check for abuse detection
    if (error.message && error.message.includes('abuse detection')) {
      return true;
    }
    
    // Check for rate limit headers
    if (error.headers && (error.headers['x-ratelimit-remaining'] === '0' || error.headers['retry-after'])) {
      return true;
    }
    
    return false;
  }

  private calculateDelay(retryCount: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retryCount);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async throttleRequests<T>(
    operations: Array<() => Promise<T>>,
    maxConcurrent = 3,
    delayBetweenRequests = 1000
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrent) {
      const batch = operations.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (operation, index) => {
        // Add delay between requests in the same batch
        if (index > 0) {
          await this.sleep(delayBetweenRequests);
        }
        return this.executeWithRetry(operation, `batch-${i}-${index}`);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + maxConcurrent < operations.length) {
        await this.sleep(delayBetweenRequests * 2);
      }
    }
    
    return results;
  }

  // Track rate limits for different APIs
  trackRequest(apiName: string, resetTime?: number): void {
    const now = Date.now();
    const current = this.requestCounts.get(apiName) || { count: 0, resetTime: now + 3600000 }; // Default 1 hour
    
    current.count++;
    
    if (resetTime) {
      current.resetTime = resetTime * 1000; // Convert to milliseconds
    }
    
    this.requestCounts.set(apiName, current);
  }

  isRateLimited(apiName: string): boolean {
    const current = this.requestCounts.get(apiName);
    if (!current) return false;
    
    const now = Date.now();
    if (now > current.resetTime) {
      this.requestCounts.delete(apiName);
      return false;
    }
    
    // Conservative estimate - assume we're rate limited if we've made many requests recently
    return current.count > 50;
  }

  getRemainingTime(apiName: string): number {
    const current = this.requestCounts.get(apiName);
    if (!current) return 0;
    
    const now = Date.now();
    return Math.max(0, current.resetTime - now);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(); 