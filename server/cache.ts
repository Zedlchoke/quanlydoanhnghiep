// Simple in-memory cache for performance optimization
// Reduces database queries for frequently accessed data

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache keys for consistent naming
export const CACHE_KEYS = {
  BUSINESSES_COUNT: 'businesses_count',
  BUSINESSES_ALL: (page: number, limit: number, sortBy: string, sortOrder: string) => 
    `businesses_all_${page}_${limit}_${sortBy}_${sortOrder}`,
  BUSINESS_BY_ID: (id: number) => `business_${id}`,
  BUSINESS_BY_TAX_ID: (taxId: string) => `business_tax_${taxId}`,
  DOCUMENT_TRANSACTIONS_ALL: 'document_transactions_all',
  DOCUMENT_TRANSACTIONS_BY_BUSINESS: (businessId: number) => `doc_trans_business_${businessId}`,
  AUTOCOMPLETE_BUSINESSES: 'autocomplete_businesses'
};

// Setup periodic cleanup (every 10 minutes)
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes for moderate changing data  
  LONG: 15 * 60 * 1000,      // 15 minutes for rarely changing data
  VERY_LONG: 60 * 60 * 1000  // 1 hour for very stable data
};