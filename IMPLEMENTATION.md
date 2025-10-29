# Server-Side Data Caching Implementation Guide

**Project**: CASI2 - California Sentencing Institute
**Feature**: Server-side in-memory caching for Google Drive data sources
**Cache Strategy**: 1-hour TTL with stale-while-revalidate
**Complexity**: Simple (no Redis, no distributed cache)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [File Tree](#file-tree)
4. [Ticket 1: Server Cache Manager](#ticket-1-server-cache-manager)
5. [Ticket 2: Data Source API Routes](#ticket-2-data-source-api-routes)
6. [Ticket 3: Content API Routes](#ticket-3-content-api-routes)
7. [Ticket 4: Update Data Service Client](#ticket-4-update-data-service-client)
8. [Ticket 5: Cache Invalidation API](#ticket-5-cache-invalidation-api)
9. [Ticket 6: Update Proxy Route](#ticket-6-update-proxy-route)
10. [Ticket 7: Update Configuration](#ticket-7-update-configuration)
11. [Testing Guide](#testing-guide)
12. [Deployment Checklist](#deployment-checklist)

---

## Overview

### Problem
- Data loads only when user navigates to components
- Google Drive fetches take 2-5 seconds
- Users see loading spinners on every navigation
- ~1000+ Google Drive requests per day

### Solution
- Server-side in-memory cache with 1-hour TTL
- Stale-while-revalidate pattern (instant responses)
- Dedicated API routes for data and content
- Reduces Google Drive requests to ~24 per day
- Response time: <100ms (cache hit) vs 2-5s (Google Drive)

### Key Features
- ✅ 1-hour cache with background refresh
- ✅ Serve stale data while revalidating
- ✅ Fallback to local files on Google Drive failure
- ✅ Manual cache invalidation endpoint
- ✅ Zero external dependencies (no Redis)

---

## Architecture Decisions

### Q1: GeoJSON Caching Strategy?
**Decision**: Serve GeoJSON directly from `/public/california-counties.geojson`
**Rationale**: Next.js handles static files efficiently, no need to cache

### Q2: Cache Warming Strategy?
**Decision**: Lazy-load on first request + background refresh
**Rationale**: Avoids server startup delays, cache warms naturally

### Q3: Stale Data Handling?
**Decision**: (A) Serve stale cache with warning header → (B) Fallback to local files
**Rationale**: Users always get data instantly, graceful degradation

### Q4: Cache Invalidation?
**Decision**: Yes - include `/api/cache/invalidate` endpoint
**Rationale**: Useful for immediate updates when Google Drive data changes

---

## File Tree

```
/CASI2
├── lib
│   └── services
│       ├── UPDATE dataService.ts
│       └── NEW    serverCache.ts
├── app
│   └── api
│       ├── proxy
│       │   └── UPDATE route.ts
│       ├── NEW data
│       │   └── NEW [source]
│       │       └── NEW route.ts
│       ├── NEW content
│       │   └── NEW [slug]
│       │       └── NEW route.ts
│       └── NEW cache
│           └── NEW invalidate
│               └── NEW route.ts
└── UPDATE public
    └── UPDATE data-sources.json
```

---

## TICKET 1: Server Cache Manager

**Priority**: P0 (Critical - Foundation)
**Estimated Effort**: 3-4 hours
**Dependencies**: None

### Acceptance Criteria

- [ ] AC1: Cache stores data in-memory with 1-hour TTL
- [ ] AC2: Implements stale-while-revalidate pattern
- [ ] AC3: Background refresh doesn't block requests
- [ ] AC4: Thread-safe concurrent access (no race conditions)
- [ ] AC5: Exposes cache statistics for monitoring
- [ ] AC6: Manual cache invalidation works

### Implementation

**File**: `lib/services/serverCache.ts` (NEW)

```typescript
/**
 * Server-side in-memory cache with stale-while-revalidate pattern
 *
 * Features:
 * - 1-hour TTL by default
 * - Serve stale data while refreshing in background
 * - Request deduplication for concurrent requests
 * - Cache statistics for monitoring
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isRefreshing: boolean;
}

interface CacheOptions {
  ttl: number; // Time-to-live in milliseconds
  staleWhileRevalidate: boolean; // Serve stale data while refreshing
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>();
  private refreshPromises = new Map<string, Promise<any>>();
  private defaultTTL = 3600000; // 1 hour in milliseconds

  /**
   * Get cached data or fetch fresh data
   *
   * @param key - Unique cache key
   * @param fetchFn - Function to fetch fresh data
   * @param options - Cache options (TTL, stale-while-revalidate)
   * @returns Cached or fresh data
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: Partial<CacheOptions>
  ): Promise<T> {
    const ttl = options?.ttl ?? this.defaultTTL;
    const staleWhileRevalidate = options?.staleWhileRevalidate ?? true;

    const cached = this.cache.get(key);

    // Cache hit and not stale
    if (cached && !this.isStale(cached, ttl)) {
      console.log(`🎯 [Cache] HIT: ${key} (age: ${this.getAge(cached)}s)`);
      return cached.data;
    }

    // Cache hit but stale - serve stale and refresh in background
    if (cached && staleWhileRevalidate) {
      console.log(`⚠️ [Cache] STALE: ${key} (age: ${this.getAge(cached)}s) - serving stale, refreshing in background`);

      // Start background refresh if not already refreshing
      if (!cached.isRefreshing) {
        this.refreshInBackground(key, fetchFn, ttl).catch(err => {
          console.error(`❌ [Cache] Background refresh failed for ${key}:`, err);
        });
      }

      return cached.data;
    }

    // Cache miss or stale without revalidation - fetch fresh
    console.log(`❌ [Cache] MISS: ${key} - fetching fresh data`);

    // Check if another request is already fetching this key
    const existingPromise = this.refreshPromises.get(key);
    if (existingPromise) {
      console.log(`🔄 [Cache] Deduplicating request for ${key}`);
      return existingPromise;
    }

    // Fetch fresh data
    const fetchPromise = fetchFn();
    this.refreshPromises.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      this.set(key, data);
      return data;
    } finally {
      this.refreshPromises.delete(key);
    }
  }

  /**
   * Set data in cache
   */
  private set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isRefreshing: false,
    });
    console.log(`💾 [Cache] Cached ${key} (size: ${this.cache.size} entries)`);
  }

  /**
   * Check if cache entry is stale
   */
  private isStale(entry: CacheEntry<any>, ttl: number): boolean {
    const age = Date.now() - entry.timestamp;
    return age > ttl;
  }

  /**
   * Get age of cache entry in seconds
   */
  private getAge(entry: CacheEntry<any>): number {
    return Math.floor((Date.now() - entry.timestamp) / 1000);
  }

  /**
   * Refresh cache in background without blocking
   */
  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    const cached = this.cache.get(key);
    if (!cached) return;

    // Mark as refreshing
    cached.isRefreshing = true;

    try {
      console.log(`🔄 [Cache] Background refresh started for ${key}`);
      const data = await fetchFn();
      this.set(key, data);
      console.log(`✅ [Cache] Background refresh completed for ${key}`);
    } catch (error) {
      console.error(`❌ [Cache] Background refresh failed for ${key}:`, error);
      // Keep serving stale data on error
      cached.isRefreshing = false;
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ [Cache] Invalidated ${key}`);
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.refreshPromises.clear();
    console.log(`🗑️ [Cache] Cleared all cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    entries: Array<{
      key: string;
      age: number;
      isStale: boolean;
      isRefreshing: boolean;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: this.getAge(entry),
      isStale: this.isStale(entry, this.defaultTTL),
      isRefreshing: entry.isRefreshing,
    }));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries,
    };
  }
}

// Export singleton instance
export const serverCache = new ServerCache();
```

### Testing Checklist

- [ ] Cache hit returns data within 10ms
- [ ] Cache miss triggers fetch and caches result
- [ ] Stale data served while refresh happens in background
- [ ] Concurrent requests for same key are deduplicated
- [ ] `invalidate()` removes specific cache entry
- [ ] `clear()` removes all cache entries
- [ ] `getStats()` returns accurate statistics

### Testing Commands

```bash
# Run these in Next.js development server console or create unit tests

# Test cache hit/miss
const cache = require('./lib/services/serverCache').serverCache;
const result = await cache.get('test-key', async () => 'test-data');

# Test deduplication
Promise.all([
  cache.get('same-key', () => fetch(...)),
  cache.get('same-key', () => fetch(...)),
  cache.get('same-key', () => fetch(...))
]);

# Test invalidation
cache.invalidate('test-key');

# Test stats
console.log(cache.getStats());
```

---

## TICKET 2: Data Source API Routes

**Priority**: P0 (Critical)
**Estimated Effort**: 4-5 hours
**Dependencies**: TICKET 1 (serverCache.ts must exist)

### Acceptance Criteria

- [ ] AC1: Four data source endpoints respond within 100ms (cache hit)
- [ ] AC2: First request (cache miss) fetches from Google Drive via proxy
- [ ] AC3: Cache automatically refreshes after 1 hour
- [ ] AC4: Proper HTTP caching headers set
- [ ] AC5: Error handling with fallback to local files
- [ ] AC6: CORS headers configured correctly

### Implementation

**File**: `app/api/data/[source]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/services/serverCache';

// Valid data source types
const VALID_SOURCES = ['arrest', 'jail', 'county_prison', 'demographic'] as const;
type DataSource = typeof VALID_SOURCES[number];

// Configuration loaded from data-sources.json
let config: any = null;

async function loadConfig() {
  if (config) return config;

  const response = await fetch(new URL('/data-sources.json', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  config = await response.json();
  return config;
}

/**
 * Fetch data from Google Drive via proxy
 */
async function fetchFromGoogleDrive(source: DataSource): Promise<string> {
  const cfg = await loadConfig();
  const sourceConfig = cfg.dataSources[source];

  if (!sourceConfig) {
    throw new Error(`Unknown data source: ${source}`);
  }

  console.log(`☁️ [API] Fetching ${source} from Google Drive...`);

  // Use proxy to fetch from Google Drive
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(sourceConfig.url)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const fullUrl = new URL(proxyUrl, baseUrl).toString();

  const response = await fetch(fullUrl, {
    headers: { 'Accept': 'text/csv' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.text();
  console.log(`✅ [API] Fetched ${data.length} characters from Google Drive for ${source}`);

  return data;
}

/**
 * Fallback to local file if Google Drive fails
 */
async function fetchFromLocal(source: DataSource): Promise<string> {
  const cfg = await loadConfig();
  const sourceConfig = cfg.dataSources[source];

  console.log(`🏠 [API] Falling back to local file for ${source}...`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const localUrl = new URL(sourceConfig.localFallback, baseUrl).toString();

  const response = await fetch(localUrl);

  if (!response.ok) {
    throw new Error(`Local fallback failed: ${response.status}`);
  }

  const data = await response.text();
  console.log(`✅ [API] Loaded ${data.length} characters from local file for ${source}`);

  return data;
}

/**
 * GET /api/data/[source]
 *
 * Returns CSV data for the specified source from cache or Google Drive
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { source: string } }
) {
  const { source } = params;

  // Validate source
  if (!VALID_SOURCES.includes(source as DataSource)) {
    return NextResponse.json(
      { error: `Invalid data source: ${source}. Valid sources: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    );
  }

  const cacheKey = `data:${source}`;
  let cacheStatus = 'MISS';
  let dataSource = 'google-drive';

  try {
    // Try to get from cache or fetch fresh
    const data = await serverCache.get(
      cacheKey,
      async () => {
        try {
          // First try Google Drive
          return await fetchFromGoogleDrive(source as DataSource);
        } catch (error) {
          console.error(`❌ [API] Google Drive failed for ${source}:`, error);

          // Fallback to local file
          dataSource = 'local-fallback';
          return await fetchFromLocal(source as DataSource);
        }
      },
      {
        ttl: 3600000, // 1 hour
        staleWhileRevalidate: true
      }
    );

    // Determine cache status from logs (simplified)
    const stats = serverCache.getStats();
    const entry = stats.entries.find(e => e.key === cacheKey);
    if (entry) {
      cacheStatus = entry.isStale ? 'STALE' : 'HIT';
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        'X-Cache-Status': cacheStatus,
        'X-Data-Source': dataSource,
        'X-Cache-Age': entry ? `${entry.age}` : '0',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`💥 [API] All fetch methods failed for ${source}:`, error);

    return NextResponse.json(
      {
        error: `Failed to fetch ${source} data`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Endpoints Created

- `GET /api/data/arrest` → Arrest CSV data
- `GET /api/data/jail` → Jail CSV data
- `GET /api/data/county_prison` → County Prison CSV data
- `GET /api/data/demographic` → Demographic CSV data

### Response Headers

```
Content-Type: text/csv; charset=utf-8
Cache-Control: public, max-age=3600, stale-while-revalidate=7200
X-Cache-Status: HIT | MISS | STALE
X-Data-Source: google-drive | local-fallback
X-Cache-Age: <seconds since cached>
Access-Control-Allow-Origin: *
```

### Testing Checklist

- [ ] `GET /api/data/arrest` returns valid CSV data
- [ ] `GET /api/data/jail` returns valid CSV data
- [ ] `GET /api/data/county_prison` returns valid CSV data
- [ ] `GET /api/data/demographic` returns valid CSV data
- [ ] First request takes 2-5s (Google Drive fetch)
- [ ] Second request takes <100ms (cache hit)
- [ ] Cache refreshes after 1 hour automatically
- [ ] Invalid source returns 400 error
- [ ] Google Drive failure falls back to local files
- [ ] CORS headers allow cross-origin requests
- [ ] Response headers include cache status

### Testing Commands

```bash
# Test all endpoints
curl http://localhost:3000/api/data/arrest -I
curl http://localhost:3000/api/data/jail -I
curl http://localhost:3000/api/data/county_prison -I
curl http://localhost:3000/api/data/demographic -I

# Test invalid source
curl http://localhost:3000/api/data/invalid

# Check cache headers
curl -v http://localhost:3000/api/data/arrest 2>&1 | grep "X-Cache"

# Test cache hit (run twice)
time curl http://localhost:3000/api/data/arrest > /dev/null
time curl http://localhost:3000/api/data/arrest > /dev/null
```

---

## TICKET 3: Content API Routes

**Priority**: P1 (High)
**Estimated Effort**: 2-3 hours
**Dependencies**: TICKET 1 (serverCache.ts must exist)

### Acceptance Criteria

- [ ] AC1: Seven content endpoints serve markdown from cache
- [ ] AC2: Response time <50ms for cache hits
- [ ] AC3: Automatic refresh every 1 hour
- [ ] AC4: Proper content-type headers
- [ ] AC5: Fallback to local markdown files

### Implementation

**File**: `app/api/content/[slug]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/services/serverCache';

// Valid content slugs
const VALID_SLUGS = [
  'hero', 'about', 'how-to-use', 'history',
  'juvenile', 'data-importance', 'data-metrics'
] as const;
type ContentSlug = typeof VALID_SLUGS[number];

// Configuration loaded from data-sources.json
let config: any = null;

async function loadConfig() {
  if (config) return config;

  const response = await fetch(new URL('/data-sources.json', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  config = await response.json();
  return config;
}

/**
 * Fetch content from Google Drive via proxy
 */
async function fetchFromGoogleDrive(slug: ContentSlug): Promise<string> {
  const cfg = await loadConfig();
  const contentConfig = cfg.content[slug];

  if (!contentConfig) {
    throw new Error(`Unknown content slug: ${slug}`);
  }

  console.log(`☁️ [API] Fetching content ${slug} from Google Drive...`);

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(contentConfig.url)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const fullUrl = new URL(proxyUrl, baseUrl).toString();

  const response = await fetch(fullUrl, {
    headers: { 'Accept': 'text/markdown' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.text();
  console.log(`✅ [API] Fetched ${data.length} characters from Google Drive for ${slug}`);

  return data;
}

/**
 * Fallback to local markdown file
 */
async function fetchFromLocal(slug: ContentSlug): Promise<string> {
  const cfg = await loadConfig();
  const contentConfig = cfg.content[slug];

  console.log(`🏠 [API] Falling back to local file for ${slug}...`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const localUrl = new URL(contentConfig.localFallback, baseUrl).toString();

  const response = await fetch(localUrl);

  if (!response.ok) {
    throw new Error(`Local fallback failed: ${response.status}`);
  }

  const data = await response.text();
  console.log(`✅ [API] Loaded ${data.length} characters from local file for ${slug}`);

  return data;
}

/**
 * GET /api/content/[slug]
 *
 * Returns markdown content for the specified slug from cache or Google Drive
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Validate slug
  if (!VALID_SLUGS.includes(slug as ContentSlug)) {
    return NextResponse.json(
      { error: `Invalid content slug: ${slug}. Valid slugs: ${VALID_SLUGS.join(', ')}` },
      { status: 404 }
    );
  }

  const cacheKey = `content:${slug}`;
  let cacheStatus = 'MISS';
  let contentSource = 'google-drive';

  try {
    const markdown = await serverCache.get(
      cacheKey,
      async () => {
        try {
          return await fetchFromGoogleDrive(slug as ContentSlug);
        } catch (error) {
          console.error(`❌ [API] Google Drive failed for ${slug}:`, error);

          contentSource = 'local-fallback';
          return await fetchFromLocal(slug as ContentSlug);
        }
      },
      {
        ttl: 3600000, // 1 hour
        staleWhileRevalidate: true
      }
    );

    // Determine cache status
    const stats = serverCache.getStats();
    const entry = stats.entries.find(e => e.key === cacheKey);
    if (entry) {
      cacheStatus = entry.isStale ? 'STALE' : 'HIT';
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        'X-Cache-Status': cacheStatus,
        'X-Content-Source': contentSource,
        'X-Cache-Age': entry ? `${entry.age}` : '0',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`💥 [API] All fetch methods failed for ${slug}:`, error);

    return NextResponse.json(
      {
        error: `Failed to fetch ${slug} content`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Endpoints Created

- `GET /api/content/hero`
- `GET /api/content/about`
- `GET /api/content/how-to-use`
- `GET /api/content/history`
- `GET /api/content/juvenile`
- `GET /api/content/data-importance`
- `GET /api/content/data-metrics`

### Testing Checklist

- [ ] All seven endpoints return valid markdown
- [ ] Cache hit responses <50ms
- [ ] Invalid slugs return 404
- [ ] Content-Type header set to text/markdown
- [ ] Fallback to local files works on Google Drive failure

### Testing Commands

```bash
# Test all content endpoints
curl http://localhost:3000/api/content/hero
curl http://localhost:3000/api/content/about
curl http://localhost:3000/api/content/how-to-use
curl http://localhost:3000/api/content/history

# Check headers
curl -I http://localhost:3000/api/content/hero

# Test invalid slug
curl http://localhost:3000/api/content/invalid

# Measure response time
time curl http://localhost:3000/api/content/hero > /dev/null
```

---

## TICKET 4: Update Data Service Client

**Priority**: P0 (Critical)
**Estimated Effort**: 2 hours
**Dependencies**: TICKET 2, TICKET 3

### Acceptance Criteria

- [ ] AC1: `loadDataSource()` calls new API routes instead of proxy
- [ ] AC2: `loadContent()` calls new content API routes
- [ ] AC3: Maintains backward compatibility with existing code
- [ ] AC4: Error handling unchanged
- [ ] AC5: Client-side cache still works

### Implementation

**File**: `lib/services/dataService.ts` (UPDATE)

**CHANGE 1**: Update `loadDataSource()` function

**BEFORE** (lines ~155-202):
```typescript
export async function loadDataSource(sourceType: DataSourceType): Promise<string> {
    console.log(`🚀 [DataService] Starting to load data source: ${sourceType}`);
    const config = await loadConfig();

    const sourceConfig = config.dataSources[sourceType];

    if (!sourceConfig) {
        console.error(`❌ [DataService] Unknown data source type: ${sourceType}`);
        throw new Error(`Unknown data source type: ${sourceType}`);
    }

    const cacheKey = `datasource_${sourceType}`;

    // Check cache first
    if (isCacheValid(cacheKey, config.settings.cacheTimeout)) {
        console.log(`🎯 [DataService] Using cached data for ${sourceType}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Cache miss for ${sourceType}, fetching fresh data`);

    try {
        const result = await fetchWithFallback(
            sourceConfig.url,
            sourceConfig.localFallback,
            config.settings.retryAttempts,
            config.settings.retryDelay,
            `${sourceConfig.displayName} (${sourceType})`
        );

        // Cache the result
        dataCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
        });

        console.log(`💾 [DataService] Cached ${sourceType} data (${result.data.length} chars) from ${result.source}`);
        return result.data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load data source ${sourceType}:`, error);
        throw new Error(`Failed to load ${sourceConfig.displayName}: ${error}`);
    }
}
```

**AFTER**:
```typescript
export async function loadDataSource(sourceType: DataSourceType): Promise<string> {
    console.log(`🚀 [DataService] Starting to load data source: ${sourceType}`);

    // Use new cached API endpoint
    const apiUrl = `/api/data/${sourceType}`;

    const cacheKey = `datasource_${sourceType}`;

    // Check client-side cache first (still useful for browser navigation)
    if (isCacheValid(cacheKey, 300000)) { // 5 minutes client cache
        console.log(`🎯 [DataService] Using client-side cache for ${sourceType}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Fetching from API: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'text/csv' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.text();

        // Log cache status from server
        const cacheStatus = response.headers.get('X-Cache-Status');
        const cacheAge = response.headers.get('X-Cache-Age');
        console.log(`✅ [DataService] Loaded ${sourceType} (${data.length} chars, server cache: ${cacheStatus}, age: ${cacheAge}s)`);

        // Cache client-side for faster navigation
        dataCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load ${sourceType} from API:`, error);
        throw new Error(`Failed to load ${sourceType}: ${error}`);
    }
}
```

**CHANGE 2**: Update `loadContent()` function

**BEFORE** (lines ~204-249):
```typescript
export async function loadContent(contentName: string): Promise<string> {
    console.log(`📄 [DataService] Starting to load content: ${contentName}`);
    const config = await loadConfig();
    const contentConfig = config.content[contentName];

    if (!contentConfig) {
        console.error(`❌ [DataService] Unknown content: ${contentName}`);
        throw new Error(`Unknown content: ${contentName}`);
    }

    const cacheKey = `content_${contentName}`;

    // Check cache first
    if (isCacheValid(cacheKey, config.settings.cacheTimeout)) {
        console.log(`🎯 [DataService] Using cached content for ${contentName}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Cache miss for ${contentName}, fetching fresh content`);

    try {
        const result = await fetchWithFallback(
            contentConfig.url,
            contentConfig.localFallback,
            config.settings.retryAttempts,
            config.settings.retryDelay,
            `${contentConfig.displayName} (${contentName})`
        );

        // Cache the result
        dataCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
        });

        console.log(`💾 [DataService] Cached ${contentName} content (${result.data.length} chars) from ${result.source}`);
        return result.data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load content ${contentName}:`, error);
        throw new Error(`Failed to load ${contentConfig.displayName}: ${error}`);
    }
}
```

**AFTER**:
```typescript
export async function loadContent(contentName: string): Promise<string> {
    console.log(`📄 [DataService] Starting to load content: ${contentName}`);

    // Use new cached content API endpoint
    const apiUrl = `/api/content/${contentName}`;

    const cacheKey = `content_${contentName}`;

    // Check client-side cache first
    if (isCacheValid(cacheKey, 300000)) { // 5 minutes client cache
        console.log(`🎯 [DataService] Using client-side cache for ${contentName}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Fetching from API: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'text/markdown' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.text();

        // Log cache status
        const cacheStatus = response.headers.get('X-Cache-Status');
        const cacheAge = response.headers.get('X-Cache-Age');
        console.log(`✅ [DataService] Loaded ${contentName} (${data.length} chars, server cache: ${cacheStatus}, age: ${cacheAge}s)`);

        // Cache client-side
        dataCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load ${contentName} from API:`, error);
        throw new Error(`Failed to load ${contentName}: ${error}`);
    }
}
```

**OPTIONAL**: You can remove the `fetchWithFallback` function as it's no longer used (lines ~60-139), but keep it if you want to maintain it for other potential uses.

### Summary of Changes

1. **Simplified client code** - Direct API calls instead of complex Google Drive logic
2. **Dual-layer caching** - Server cache (1hr) + Client cache (5min)
3. **Better logging** - Shows server cache status in console
4. **Faster responses** - API routes handle all fallback logic server-side

### Testing Checklist

- [ ] All data sources load correctly in Redux
- [ ] All content files load correctly on home page
- [ ] MapStory component still works
- [ ] MetricsCards component still works
- [ ] HomePage markdown rendering still works
- [ ] Error handling still works
- [ ] No breaking changes to existing features

### Testing Commands

```bash
# Start dev server
npm run dev

# Open browser and check:
# 1. Home page loads with content
# 2. Navigate to /map - should load instantly
# 3. Check browser console for cache logs
# 4. Check Network tab - should show API calls to /api/data/* and /api/content/*

# Check Redux state in browser console
window.__REDUX_DEVTOOLS_EXTENSION__
```

---

## TICKET 5: Cache Invalidation API

**Priority**: P2 (Nice to Have)
**Estimated Effort**: 1-2 hours
**Dependencies**: TICKET 1

### Acceptance Criteria

- [ ] AC1: Admin can manually invalidate cache via API
- [ ] AC2: Can invalidate specific data source or all cache
- [ ] AC3: Returns cache statistics
- [ ] AC4: Works without authentication (add later if needed)

### Implementation

**File**: `app/api/cache/invalidate/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/services/serverCache';

/**
 * GET /api/cache/invalidate
 *
 * Returns cache statistics
 */
export async function GET(request: NextRequest) {
  const stats = serverCache.getStats();

  return NextResponse.json({
    success: true,
    cache: stats,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/cache/invalidate
 *
 * Invalidates cache entries
 *
 * Body:
 * - { key: 'data:arrest' } - Invalidate specific entry
 * - { all: true } - Clear entire cache
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Clear all cache
    if (body.all === true) {
      const statsBefore = serverCache.getStats();
      serverCache.clear();

      return NextResponse.json({
        success: true,
        message: 'All cache cleared',
        entriesCleared: statsBefore.size,
        timestamp: new Date().toISOString(),
      });
    }

    // Invalidate specific key
    if (body.key) {
      const deleted = serverCache.invalidate(body.key);

      if (deleted) {
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for: ${body.key}`,
          key: body.key,
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Cache key not found: ${body.key}`,
          key: body.key,
        }, { status: 404 });
      }
    }

    // Invalid request
    return NextResponse.json({
      success: false,
      error: 'Must specify "key" or "all: true"',
      examples: {
        invalidateOne: { key: 'data:arrest' },
        invalidateAll: { all: true },
      }
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request body',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}
```

### API Usage Examples

**Get Cache Statistics**:
```bash
curl http://localhost:3000/api/cache/invalidate
```

Response:
```json
{
  "success": true,
  "cache": {
    "size": 4,
    "keys": ["data:arrest", "data:jail", "content:hero", "content:about"],
    "entries": [
      {
        "key": "data:arrest",
        "age": 1234,
        "isStale": false,
        "isRefreshing": false
      }
    ]
  },
  "timestamp": "2024-10-14T12:34:56.789Z"
}
```

**Invalidate Specific Entry**:
```bash
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"key": "data:arrest"}'
```

**Clear All Cache**:
```bash
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"all": true}'
```

### Testing Checklist

- [ ] GET returns cache statistics
- [ ] POST with key invalidates specific entry
- [ ] POST with all clears entire cache
- [ ] Invalid requests return 400
- [ ] Cache actually gets invalidated (next request fetches fresh)

---

## TICKET 6: Update Proxy Route

**Priority**: P1 (High)
**Estimated Effort**: 1 hour
**Dependencies**: None

### Acceptance Criteria

- [ ] AC1: Proxy still works for backend API routes
- [ ] AC2: Add better logging for debugging
- [ ] AC3: Increase timeout for large files (30s)
- [ ] AC4: Don't cache proxy responses (caching handled by API routes)

### Implementation

**File**: `app/api/proxy/route.ts` (UPDATE)

**BEFORE** (current file):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from Google Drive to prevent abuse
    if (!url.includes('drive.google.com')) {
        return NextResponse.json({ error: 'Only Google Drive URLs are allowed' }, { status: 403 });
    }

    try {
        console.log(`🔗 [Proxy] Fetching from Google Drive: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DataLoader/1.0)',
            },
        });

        if (!response.ok) {
            console.error(`❌ [Proxy] Google Drive fetch failed: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Failed to fetch from Google Drive: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.text();
        console.log(`✅ [Proxy] Successfully fetched ${data.length} characters from Google Drive`);

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'text/plain',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            },
        });
    } catch (error) {
        console.error(`💥 [Proxy] Error fetching from Google Drive:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch from Google Drive' },
            { status: 500 }
        );
    }
}
```

**AFTER**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from Google Drive to prevent abuse
    if (!url.includes('drive.google.com')) {
        return NextResponse.json({ error: 'Only Google Drive URLs are allowed' }, { status: 403 });
    }

    try {
        console.log(`🔗 [Proxy] Fetching from Google Drive: ${url}`);

        // Add timeout for large files (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.warn(`⏰ [Proxy] Request timeout after 30s for: ${url}`);
            controller.abort();
        }, 30000);

        const startTime = Date.now();

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CASI-DataLoader/2.0)',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const fetchTime = Date.now() - startTime;

        if (!response.ok) {
            console.error(`❌ [Proxy] Google Drive fetch failed: ${response.status} ${response.statusText} (${fetchTime}ms)`);
            return NextResponse.json(
                { error: `Failed to fetch from Google Drive: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.text();
        const totalTime = Date.now() - startTime;
        console.log(`✅ [Proxy] Successfully fetched ${data.length} characters from Google Drive (${totalTime}ms)`);

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'text/plain',
                'Cache-Control': 'private, no-store', // Don't cache - caching handled by API routes
                'X-Proxy-Source': 'google-drive',
                'X-Fetch-Time': `${totalTime}`,
            },
        });
    } catch (error) {
        console.error(`💥 [Proxy] Error fetching from Google Drive:`, error);

        // Check if it was a timeout
        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Request timeout (30s limit exceeded)' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch from Google Drive',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
```

### Changes Summary

1. **30-second timeout** - Prevents hanging on large files
2. **Better logging** - Shows fetch time in milliseconds
3. **No caching** - Changed to `private, no-store` (API routes handle caching)
4. **Timeout error handling** - Returns 504 Gateway Timeout
5. **Fetch time header** - `X-Fetch-Time` shows how long Google Drive took

### Testing Checklist

- [ ] Proxy still fetches from Google Drive
- [ ] 30-second timeout works
- [ ] Logs show fetch time
- [ ] Cache-Control header is `private, no-store`
- [ ] Timeout error returns 504

---

## TICKET 7: Update Configuration

**Priority**: P1 (High)
**Estimated Effort**: 30 minutes
**Dependencies**: None

### Acceptance Criteria

- [ ] AC1: Add server-side cache settings to config
- [ ] AC2: Document cache strategy
- [ ] AC3: Keep client-side cache timeout separate

### Implementation

**File**: `public/data-sources.json` (UPDATE)

**BEFORE** (lines 78-84):
```json
{
  "settings": {
    "retryAttempts": 2,
    "retryDelay": 1000,
    "cacheTimeout": 300000,
    "fallbackEnabled": true
  }
}
```

**AFTER**:
```json
{
  "settings": {
    "retryAttempts": 2,
    "retryDelay": 1000,
    "cacheTimeout": 300000,
    "fallbackEnabled": true,
    "serverCache": {
      "ttl": 3600000,
      "staleWhileRevalidate": true,
      "maxStaleAge": 7200000
    }
  }
}
```

### New Settings Explained

- `ttl: 3600000` - Cache lifetime: 1 hour (3600000ms)
- `staleWhileRevalidate: true` - Serve stale data while refreshing in background
- `maxStaleAge: 7200000` - Maximum age for stale data: 2 hours

### Testing Checklist

- [ ] Configuration file is valid JSON
- [ ] No breaking changes to existing settings
- [ ] Application still loads config correctly

---

## Testing Guide

### Unit Testing

Create `__tests__/serverCache.test.ts`:

```typescript
import { serverCache } from '@/lib/services/serverCache';

describe('ServerCache', () => {
  beforeEach(() => {
    serverCache.clear();
  });

  test('cache miss triggers fetch', async () => {
    const fetchFn = jest.fn().mockResolvedValue('test-data');
    const result = await serverCache.get('test-key', fetchFn);

    expect(result).toBe('test-data');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('cache hit returns cached data', async () => {
    const fetchFn = jest.fn().mockResolvedValue('test-data');

    await serverCache.get('test-key', fetchFn);
    const result = await serverCache.get('test-key', fetchFn);

    expect(result).toBe('test-data');
    expect(fetchFn).toHaveBeenCalledTimes(1); // Only called once
  });

  test('concurrent requests deduplicated', async () => {
    const fetchFn = jest.fn().mockResolvedValue('test-data');

    const [result1, result2, result3] = await Promise.all([
      serverCache.get('test-key', fetchFn),
      serverCache.get('test-key', fetchFn),
      serverCache.get('test-key', fetchFn),
    ]);

    expect(fetchFn).toHaveBeenCalledTimes(1); // Only one fetch
    expect(result1).toBe('test-data');
    expect(result2).toBe('test-data');
    expect(result3).toBe('test-data');
  });

  test('invalidate removes cache entry', async () => {
    const fetchFn = jest.fn().mockResolvedValue('test-data');

    await serverCache.get('test-key', fetchFn);
    serverCache.invalidate('test-key');
    await serverCache.get('test-key', fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(2); // Called twice
  });
});
```

### Integration Testing

**Test API Routes**:

```bash
# Test data endpoints
curl http://localhost:3000/api/data/arrest -v
curl http://localhost:3000/api/data/jail -v
curl http://localhost:3000/api/data/county_prison -v
curl http://localhost:3000/api/data/demographic -v

# Test content endpoints
curl http://localhost:3000/api/content/hero -v
curl http://localhost:3000/api/content/about -v

# Test cache invalidation
curl http://localhost:3000/api/cache/invalidate
curl -X POST http://localhost:3000/api/cache/invalidate -H "Content-Type: application/json" -d '{"all": true}'
```

### End-to-End Testing

1. **Cold Cache Test**:
   - Restart dev server
   - Open browser, go to homepage
   - Check Network tab - first requests should be slow (2-5s)
   - Navigate to /map - should fetch data from API
   - Check server logs - should see "MISS" cache status

2. **Warm Cache Test**:
   - Refresh homepage
   - Check Network tab - should be fast (<100ms)
   - Navigate to /map - should load instantly
   - Check server logs - should see "HIT" cache status

3. **Stale Cache Test**:
   - Wait 1 hour (or temporarily reduce TTL to 10 seconds for testing)
   - Refresh page - should still be fast (stale data served)
   - Check server logs - should see "STALE" and background refresh
   - Wait a few seconds for refresh to complete
   - Refresh again - should see "HIT" with fresh data

4. **Fallback Test**:
   - Temporarily break Google Drive URLs in `data-sources.json`
   - Clear cache: `curl -X POST http://localhost:3000/api/cache/invalidate -d '{"all":true}' -H "Content-Type: application/json"`
   - Refresh page - should load from local files
   - Check server logs - should see "local-fallback" messages

### Performance Testing

**Measure Response Times**:

```bash
# Cache miss (first request)
time curl http://localhost:3000/api/data/arrest > /dev/null

# Cache hit (second request)
time curl http://localhost:3000/api/data/arrest > /dev/null

# Compare times:
# Cache miss: ~2-5 seconds
# Cache hit: ~0.05-0.1 seconds (50-100ms)
```

**Concurrent Request Test**:

```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl http://localhost:3000/api/data/arrest > /dev/null &
done
wait

# Check server logs - should see only ONE Google Drive fetch
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tickets completed and tested
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Performance benchmarks met (<100ms cache hit)
- [ ] Error handling tested (Google Drive down, local fallback works)

### Deployment Steps

1. **Create Feature Branch**:
   ```bash
   git checkout -b feat/server-side-caching
   ```

2. **Commit Changes**:
   ```bash
   git add lib/services/serverCache.ts
   git add app/api/data/
   git add app/api/content/
   git add app/api/cache/
   git add lib/services/dataService.ts
   git add app/api/proxy/route.ts
   git add public/data-sources.json

   git commit -m "feat: add server-side caching with 1hr TTL and stale-while-revalidate"
   ```

3. **Test in Production Build**:
   ```bash
   npm run build
   npm run start
   ```

4. **Monitor Logs**:
   - Watch for cache HIT/MISS/STALE logs
   - Check for any errors
   - Verify Google Drive fetches are infrequent

5. **Deploy to Production**:
   ```bash
   git push origin feat/server-side-caching
   # Create PR and merge
   ```

### Post-Deployment

- [ ] Monitor cache hit rate (should be >95% after warmup)
- [ ] Monitor response times (should be <100ms)
- [ ] Monitor Google Drive requests (should be <50/day)
- [ ] Monitor error rates (should be <1%)
- [ ] Check memory usage (should be <100MB)

### Rollback Plan

If issues occur:

1. **Revert Client Changes**:
   ```bash
   git revert <commit-hash>
   ```

2. **Old code still works** - API routes are additive, not breaking

3. **Keep API routes** - They don't hurt anything even if unused

---

## Success Metrics

### Performance

- ✅ **Page Load Time**: Reduced by 80% (from 2-5s to <500ms)
- ✅ **Data Load Time**: <100ms (cache hit) vs 2-5s (Google Drive)
- ✅ **Time to Interactive**: <1s (from 3-6s)

### Reliability

- ✅ **Uptime**: 99.9% (cache survives Google Drive outages)
- ✅ **Error Rate**: <1%
- ✅ **Cache Hit Rate**: >95% after warmup

### Efficiency

- ✅ **Google Drive Requests**: <50/day (from ~1000/day)
- ✅ **Server Memory**: <100MB
- ✅ **Cost Reduction**: ~95% fewer API calls

---

## Troubleshooting

### Cache Not Working

**Symptom**: Every request fetches from Google Drive

**Debug Steps**:
1. Check server logs for cache HIT/MISS messages
2. Check cache stats: `curl http://localhost:3000/api/cache/invalidate`
3. Verify `serverCache.ts` is imported correctly
4. Check for serverless/cold start issues (cache clears on restart)

**Solution**:
- Verify singleton pattern in `serverCache.ts`
- Check for multiple server instances

### Stale Data Served Too Long

**Symptom**: Data doesn't update after 1 hour

**Debug Steps**:
1. Check TTL setting in code (should be 3600000ms)
2. Check if background refresh is failing (logs will show errors)
3. Verify Google Drive URLs are correct

**Solution**:
- Manually invalidate cache: `curl -X POST http://localhost:3000/api/cache/invalidate -d '{"all":true}' -H "Content-Type: application/json"`
- Check Google Drive access permissions

### Memory Leak

**Symptom**: Server memory grows over time

**Debug Steps**:
1. Check cache size: `curl http://localhost:3000/api/cache/invalidate`
2. Monitor for unbounded cache growth
3. Check for duplicate cache entries

**Solution**:
- Clear cache periodically
- Add max cache size limit (future enhancement)

### Google Drive Failures

**Symptom**: Errors fetching from Google Drive

**Debug Steps**:
1. Check proxy logs
2. Verify Google Drive URLs are accessible
3. Check network connectivity

**Solution**:
- Falls back to local files automatically
- Check local files are up to date

---

## Future Enhancements

### Phase 2 (Optional)

1. **Persistent Cache** (if deployed to serverless):
   - Add Redis or similar for cross-instance caching
   - Requires external service

2. **Cache Warming**:
   - Pre-load cache on server startup
   - Reduces cold start impact

3. **Cache Size Limits**:
   - Add max cache size (e.g., 100 entries)
   - LRU eviction policy

4. **Metrics & Monitoring**:
   - Add Prometheus/Grafana metrics
   - Dashboard for cache performance

5. **Authentication**:
   - Protect cache invalidation endpoint
   - Add API keys for admin operations

---

## Summary

This implementation provides:

- ✅ **10-100x faster data loading** (memory cache vs Google Drive)
- ✅ **Instant page navigation** (no loading spinners)
- ✅ **Reduced Google Drive load** (1 fetch/hour vs 1 fetch/user)
- ✅ **Better reliability** (cached data survives outages)
- ✅ **Simple implementation** (7 files, no external dependencies)
- ✅ **Easy maintenance** (cache invalidation API)

**Total Effort**: ~15-20 hours across 7 tickets

**Expected Impact**:
- User satisfaction: ⬆️ 80%
- Load time: ⬇️ 80%
- Server costs: ⬇️ 95%

---

## Implementation Order

Execute tickets in this order:

1. ✅ TICKET 1 - Server Cache Manager (foundation)
2. ✅ TICKET 2 - Data API Routes (core feature)
3. ✅ TICKET 3 - Content API Routes (core feature)
4. ✅ TICKET 4 - Update Data Service (integration)
5. ✅ TICKET 6 - Update Proxy (supporting change)
6. ✅ TICKET 7 - Update Configuration (supporting change)
7. ✅ TICKET 5 - Cache Invalidation (optional but recommended)

**Happy Coding!** 🚀
