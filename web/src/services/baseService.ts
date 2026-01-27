import api from './api';
import { isError } from 'lodash';

// 定义缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expirationTime?: number; // 过期时间戳
}

// 简单的内存缓存实现
class RequestCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultCacheTime = 5 * 60 * 1000; // 默认缓存5分钟

  // 生成缓存键
  private getCacheKey(url: string, method: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsString}`;
  }

  // 设置缓存
  setCache<T>(
    url: string,
    method: string,
    data: T,
    params?: any,
    cacheTime?: number
  ): void {
    // 只缓存GET请求
    if (method.toUpperCase() !== 'GET') return;

    const key = this.getCacheKey(url, method, params);
    const cacheTimeMs = cacheTime ?? this.defaultCacheTime;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expirationTime: cacheTimeMs > 0 ? Date.now() + cacheTimeMs : undefined
    });
  }

  // 获取缓存
  getCache<T>(url: string, method: string, params?: any): T | null {
    const key = this.getCacheKey(url, method, params);
    const cacheItem = this.cache.get(key);

    if (!cacheItem) return null;

    // 检查是否过期
    if (cacheItem.expirationTime && Date.now() > cacheItem.expirationTime) {
      this.cache.delete(key);
      return null;
    }

    return cacheItem.data;
  }

  // 清除指定URL的缓存
  clearCache(url: string, method?: string): void {
    for (const [key, _] of this.cache) {
      if (method) {
        if (key.startsWith(`${method.toUpperCase()}:${url}:`)) {
          this.cache.delete(key);
        }
      } else {
        // 清除所有包含该URL的缓存
        const urlKeyPart = `:${url}:`;
        if (key.includes(urlKeyPart)) {
          this.cache.delete(key);
        }
      }
    }
  }

  // 清除所有缓存
  clearAllCache(): void {
    this.cache.clear();
  }

  // 缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.keys())
    };
  }
}

// 创建缓存实例
const requestCache = new RequestCache();

// 统一请求处理函数
export const request = async <T>(
  apiCall: () => Promise<T>,
  errorMessage = '请求失败',
  options?: {
    cache?: boolean;         // 是否使用缓存
    cacheTime?: number;      // 缓存时间(毫秒)
    cacheKey?: string;       // 自定义缓存键
    invalidateCache?: string | string[]; // 操作后需要清除的缓存URL
  }
): Promise<T> => {
  try {
    // 检查是否有缓存
    if (options?.cache && options?.cacheKey) {
      const cachedData = requestCache.getCache<T>(options.cacheKey, 'GET');
      if (cachedData) {
        return cachedData;
      }
    }

    // 执行API调用
    const result = await apiCall();

    // 设置缓存
    if (options?.cache && options?.cacheKey) {
      requestCache.setCache<T>(options.cacheKey, 'GET', result, undefined, options.cacheTime);
    }

    // 清除需要失效的缓存
    if (options?.invalidateCache) {
      const urlsToInvalidate = Array.isArray(options.invalidateCache) 
        ? options.invalidateCache 
        : [options.invalidateCache];
      
      urlsToInvalidate.forEach(url => requestCache.clearCache(url));
    }

    return result;
  } catch (error) {
    // 使用lodash的isError检查是否为真正的错误对象
    const errorMsg = isError(error)
      ? `${errorMessage}: ${error.message}`
      : errorMessage;
    console.error(errorMsg, error);
    throw error;
  }
};

// 批量请求处理
export const batchRequest = async <T>(
  requests: Array<() => Promise<T>>,
  errorMessage = '批量请求失败'
): Promise<T[]> => {
  try {
    return await Promise.all(requests);
  } catch (error) {
    const errorMsg = isError(error)
      ? `${errorMessage}: ${error.message}`
      : errorMessage;
    console.error(errorMsg, error);
    throw error;
  }
};

// 缓存相关工具函数
export const cacheUtils = {
  // 清除指定URL的缓存
  clearCache: (url: string, method?: string) => {
    requestCache.clearCache(url, method);
  },
  
  // 清除所有缓存
  clearAllCache: () => {
    requestCache.clearAllCache();
  },
  
  // 获取缓存统计信息
  getCacheStats: () => {
    return requestCache.getCacheStats();
  }
};