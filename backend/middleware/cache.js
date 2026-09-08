const crypto = require('crypto');

/**
 * In-memory high-speed cache store with TTL and tag-based invalidation.
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.tagMap = new Map(); // tag -> Set of keys
  }

  set(key, data, ttlSeconds, tags = []) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const etag = `"${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;
    this.cache.set(key, { data, expiresAt, etag });

    tags.forEach((tag) => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag).add(key);
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  invalidateTag(tag) {
    if (!this.tagMap.has(tag)) return 0;
    const keys = this.tagMap.get(tag);
    let count = 0;
    keys.forEach((key) => {
      if (this.cache.delete(key)) count++;
    });
    this.tagMap.delete(tag);
    return count;
  }

  clear() {
    this.cache.clear();
    this.tagMap.clear();
  }
}

const memoryCache = new MemoryCache();

/**
 * Express middleware to cache GET requests for `ttlSeconds`
 * @param {number} ttlSeconds Duration in seconds
 * @param {string[]} tags Cache tags for targeted invalidation (e.g., ['reports'])
 */
const cacheResponse = (ttlSeconds = 30, tags = ['reports']) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build unique cache key considering user ID (if authenticated) and query parameters
    const userScope = req.user ? req.user._id.toString() : 'public';
    const cacheKey = `${req.baseUrl || ''}${req.path}:${userScope}:${JSON.stringify(req.query || {})}`;

    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('ETag', cached.etag);
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);

      // Check If-None-Match header for 304 Not Modified
      if (req.headers['if-none-match'] === cached.etag) {
        return res.status(304).end();
      }

      return res.status(200).json(cached.data);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body && body.success !== false) {
        memoryCache.set(cacheKey, body, ttlSeconds, tags);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate all cached responses associated with a specific tag
 */
const invalidateCache = (tag) => {
  return memoryCache.invalidateTag(tag);
};

module.exports = {
  cacheResponse,
  invalidateCache,
  memoryCache,
};
