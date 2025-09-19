interface CacheItem {
  value: string;
  expiry?: number;
}

export class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheItem> = new Map();

  private constructor() {}

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  set(key: string, value: string, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): string | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  keys(): string[] {
    // Clean expired keys first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.cache.delete(key);
      }
    }
    
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  // Helper methods for compatibility
  incr(key: string): number {
    const current = parseInt(this.get(key) || '0');
    const newValue = current + 1;
    this.set(key, newValue.toString());
    return newValue;
  }

  decr(key: string): number {
    const current = parseInt(this.get(key) || '0');
    const newValue = Math.max(0, current - 1);
    this.set(key, newValue.toString());
    return newValue;
  }

  expire(key: string, seconds: number): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    item.expiry = Date.now() + (seconds * 1000);
    return true;
  }

  expireat(key: string, timestamp: number): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    item.expiry = timestamp * 1000; // Convert to milliseconds
    return true;
  }
}