// Performance optimizations for chatbot
export class ChatbotOptimizer {
  private static readonly MAX_CACHE_SIZE = 100;
  private static readonly DEBOUNCE_DELAY = 300;
  private static readonly MAX_MESSAGE_HISTORY = 50;
  
  // Debounce function for search queries
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number = ChatbotOptimizer.DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle function for scroll events and rapid interactions
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number = 100
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  // Memory management for message history
  static limitMessageHistory<T>(messages: T[]): T[] {
    if (messages.length <= ChatbotOptimizer.MAX_MESSAGE_HISTORY) {
      return messages;
    }
    
    // Keep the first message (usually greeting) and the most recent messages
    const firstMessage = messages[0];
    const recentMessages = messages.slice(-ChatbotOptimizer.MAX_MESSAGE_HISTORY + 1);
    
    return [firstMessage, ...recentMessages];
  }

  // Lazy loading for components
  static createLazyComponent<T extends React.ComponentType<Record<string, unknown>>>(
    importFunc: () => Promise<{ default: T }>
  ) {
    return React.lazy(importFunc);
  }

  // Cache management utilities
  static createLRUCache<K, V>(maxSize: number = ChatbotOptimizer.MAX_CACHE_SIZE) {
    const cache = new Map<K, V>();
    
    return {
      get(key: K): V | undefined {
        const value = cache.get(key);
        if (value !== undefined) {
          // Move to end (most recently used)
          cache.delete(key);
          cache.set(key, value);
        }
        return value;
      },
      
      set(key: K, value: V): void {
        if (cache.has(key)) {
          cache.delete(key);
        } else if (cache.size >= maxSize) {
          // Remove least recently used
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, value);
      },
      
      clear(): void {
        cache.clear();
      },
      
      size(): number {
        return cache.size;
      }
    };
  }

  // Optimize images for chat display
  static optimizeImageUrl(url: string, maxWidth: number = 300): string {
    if (!url) return url;
    
    // For Shopify images, add size parameters
    if (url.includes('shopify')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${maxWidth}&height=${maxWidth}&crop=center`;
    }
    
    return url;
  }

  // Bundle splitting for chat features
  static shouldLoadAdvancedFeatures(): boolean {
    // Load advanced features only when needed
    return window.innerWidth >= 768; // Desktop only for advanced features
  }

  // Performance monitoring
  static measurePerformance<T>(
    operation: string,
    func: () => T | Promise<T>
  ): T | Promise<T> {
    const start = performance.now();
    
    try {
      const result = func();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const end = performance.now();
          console.debug(`Chatbot ${operation} took ${end - start}ms`);
        });
      } else {
        const end = performance.now();
        console.debug(`Chatbot ${operation} took ${end - start}ms`);
        return result;
      }
    } catch (error) {
      const end = performance.now();
      console.error(`Chatbot ${operation} failed after ${end - start}ms:`, error);
      throw error;
    }
  }

  // Memory usage monitoring
  static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = performance.memory as {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
      console.debug('Chatbot memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }

  // Batch API requests
  static createBatchProcessor<T, R>(
    processFn: (batch: T[]) => Promise<R[]>,
    batchSize: number = 5,
    delay: number = 100
  ) {
    const queue: T[] = [];
    let timeoutId: NodeJS.Timeout | null = null;
    const pending = new Map<T, { resolve: (value: R) => void; reject: (error: unknown) => void }>();

    const processBatch = async () => {
      if (queue.length === 0) return;

      const batch = queue.splice(0, batchSize);
      timeoutId = null;

      try {
        const results = await processFn(batch);
        batch.forEach((item, index) => {
          const callbacks = pending.get(item);
          if (callbacks) {
            callbacks.resolve(results[index]);
            pending.delete(item);
          }
        });
      } catch (error) {
        batch.forEach((item) => {
          const callbacks = pending.get(item);
          if (callbacks) {
            callbacks.reject(error);
            pending.delete(item);
          }
        });
      }

      // Process remaining items
      if (queue.length > 0) {
        timeoutId = setTimeout(processBatch, delay);
      }
    };

    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        queue.push(item);
        pending.set(item, { resolve, reject });

        if (!timeoutId) {
          timeoutId = setTimeout(processBatch, delay);
        }
      });
    };
  }

  // Service Worker integration for offline support
  static setupOfflineSupport(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/chatbot-sw.js')
        .then((registration) => {
          console.debug('Chatbot service worker registered:', registration);
        })
        .catch((error) => {
          console.debug('Chatbot service worker registration failed:', error);
        });
    }
  }
}

// React import for lazy loading
import React from 'react';
