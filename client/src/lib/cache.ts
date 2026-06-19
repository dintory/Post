/**
 * Lightweight client-side cache with TTL.
 * Stores API responses in memory so navigating between pages
 * doesn't re-fetch the same data unnecessarily.
 *
 * Usage:
 *   const data = await cachedFetch('/api/schedules', { ttl: 30000 });
 *   // Subsequent calls within 30s use cached data, no network request.
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL = 30_000; // 30 seconds

/**
 * Fetch with client-side caching.
 *
 * @param url  API path (e.g. "/api/schedules")
 * @param opts ttl in ms, or any RequestInit
 */
export async function cachedFetch(
  url: string,
  opts?: { ttl?: number } & RequestInit,
): Promise<any> {
  const ttl = opts?.ttl ?? DEFAULT_TTL;
  const now = Date.now();
  const cached = store.get(url);

  // Return cached entry if still fresh
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  // Fetch fresh data
  const headers = new Headers(opts?.headers);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    // Don't cache errors
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();

  // Cache the result
  store.set(url, { data, expiresAt: now + ttl });

  return data;
}

/**
 * Invalidate a specific cached endpoint.
 */
export function invalidateCache(url: string): void {
  store.delete(url);
}

/**
 * Invalidate all cached endpoints.
 */
export function clearCache(): void {
  store.clear();
}
