/**
 * Request Cache Manager Module
 *
 * Manages caching of AI request previews and results to prevent data loss from user errors.
 * Uses both memory (Map) and localStorage for persistence.
 */

class RequestCacheManager {
    constructor() {
        // Memory cache for fast access
        this.previewCache = new Map();
        this.previewCacheTimestamps = new Map();

        // Storage keys
        this.PREVIEW_CACHE_KEY = 'ai_request_previews';
        this.RESULT_CACHE_KEY = 'ai_results';

        // Default TTL values (in milliseconds)
        this.DEFAULT_PREVIEW_TTL = 10 * 60 * 1000; // 10 minutes
        this.DEFAULT_RESULT_TTL = 30 * 60 * 1000; // 30 minutes

        // Initialize
        this.initialize();
    }

    /**
     * Initialize cache manager
     */
    initialize() {
        // Clear expired cache on initialization
        this.clearExpired();

        // Load persisted previews from localStorage
        this.loadPersistedPreviews();
    }

    /**
     * Generate unique request ID
     * @returns {string} Unique request ID in format "req_${timestamp}_${random}"
     */
    generateRequestId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `req_${timestamp}_${random}`;
    }

    /**
     * Save preview to cache
     * @param {string} requestId - Request ID
     * @param {Object} aiRequest - AI request preview object
     * @param {number} ttl - Time to live in milliseconds (default: 10 minutes)
     */
    savePreview(requestId, aiRequest, ttl = this.DEFAULT_PREVIEW_TTL) {
        if (!requestId || !aiRequest) {
            console.error('[RequestCacheManager] Invalid arguments for savePreview');
            return;
        }

        const timestamp = Date.now();
        const expirationTime = timestamp + ttl;

        // Save to memory cache (fast access)
        this.previewCache.set(requestId, aiRequest);
        this.previewCacheTimestamps.set(requestId, expirationTime);

        // Save to localStorage (persistence)
        try {
            this.persistPreviews();
        } catch (error) {
            console.error('[RequestCacheManager] Failed to persist previews:', error);
        }
    }

    /**
     * Get preview from cache
     * @param {string} requestId - Request ID
     * @returns {Object|null} AI request preview object or null if not found or expired
     */
    getPreview(requestId) {
        if (!requestId) {
            return null;
        }

        // Check memory cache first (fast access)
        if (this.previewCache.has(requestId)) {
            const expirationTime = this.previewCacheTimestamps.get(requestId) || 0;
            const currentTime = Date.now();

            if (currentTime > expirationTime) {
                // Preview expired
                this.clearPreview(requestId);
                return null;
            }

            return this.previewCache.get(requestId);
        }

        // Not in memory, check localStorage
        try {
            const persistedData = this.loadPersistedPreviews();
            if (persistedData && persistedData.previews && persistedData.previews[requestId]) {
                const previewData = persistedData.previews[requestId];
                const currentTime = Date.now();

                if (currentTime > previewData.expirationTime) {
                    // Preview expired
                    this.clearPreview(requestId);
                    return null;
                }

                // Restore to memory cache
                this.previewCache.set(requestId, previewData.request);
                this.previewCacheTimestamps.set(requestId, previewData.expirationTime);

                return previewData.request;
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to load persisted preview:', error);
        }

        return null;
    }

    /**
     * Clear specific preview from cache
     * @param {string} requestId - Request ID
     */
    clearPreview(requestId) {
        this.previewCache.delete(requestId);
        this.previewCacheTimestamps.delete(requestId);

        try {
            this.persistPreviews();
        } catch (error) {
            console.error('[RequestCacheManager] Failed to persist after clear:', error);
        }
    }

    /**
     * Save AI result to cache
     * @param {string} requestId - Request ID
     * @param {Object} result - AI result object
     * @param {number} ttl - Time to live in milliseconds (default: 30 minutes)
     */
    saveResult(requestId, result, ttl = this.DEFAULT_RESULT_TTL) {
        if (!requestId || !result) {
            console.error('[RequestCacheManager] Invalid arguments for saveResult');
            return;
        }

        const timestamp = Date.now();
        const expirationTime = timestamp + ttl;

        try {
            const persistedData = this.loadPersistedResults();
            persistedData.results[requestId] = {
                result: result,
                timestamp: timestamp,
                expirationTime: expirationTime
            };

            localStorage.setItem(this.RESULT_CACHE_KEY, JSON.stringify(persistedData));
        } catch (error) {
            console.error('[RequestCacheManager] Failed to save result:', error);
        }
    }

    /**
     * Get AI result from cache
     * @param {string} requestId - Request ID
     * @returns {Object|null} AI result object or null if not found or expired
     */
    getResult(requestId) {
        if (!requestId) {
            return null;
        }

        try {
            const persistedData = this.loadPersistedResults();
            if (persistedData && persistedData.results && persistedData.results[requestId]) {
                const resultData = persistedData.results[requestId];
                const currentTime = Date.now();

                if (currentTime > resultData.expirationTime) {
                    // Result expired
                    this.clearResult(requestId);
                    return null;
                }

                return resultData.result;
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to load result:', error);
        }

        return null;
    }

    /**
     * Clear specific result from cache
     * @param {string} requestId - Request ID
     */
    clearResult(requestId) {
        try {
            const persistedData = this.loadPersistedResults();
            if (persistedData && persistedData.results) {
                delete persistedData.results[requestId];
                localStorage.setItem(this.RESULT_CACHE_KEY, JSON.stringify(persistedData));
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to clear result:', error);
        }
    }

    /**
     * Clear all expired cache entries
     */
    clearExpired() {
        const currentTime = Date.now();

        // Clear expired previews from memory
        for (const [requestId, expirationTime] of this.previewCacheTimestamps.entries()) {
            if (currentTime > expirationTime) {
                this.previewCache.delete(requestId);
                this.previewCacheTimestamps.delete(requestId);
            }
        }

        // Clear expired previews from localStorage
        try {
            let needsPersist = false;
            for (const [requestId, expirationTime] of this.previewCacheTimestamps.entries()) {
                if (currentTime > expirationTime) {
                    this.previewCache.delete(requestId);
                    this.previewCacheTimestamps.delete(requestId);
                    needsPersist = true;
                }
            }
            if (needsPersist) {
                this.persistPreviews();
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to clear expired previews from localStorage:', error);
        }

        // Clear expired results from localStorage
        try {
            const persistedData = this.loadPersistedResults();
            if (persistedData && persistedData.results) {
                let hasExpired = false;
                for (const requestId in persistedData.results) {
                    if (persistedData.results.hasOwnProperty(requestId)) {
                        const resultData = persistedData.results[requestId];
                        if (currentTime > resultData.expirationTime) {
                            delete persistedData.results[requestId];
                            hasExpired = true;
                        }
                    }
                }
                if (hasExpired) {
                    localStorage.setItem(this.RESULT_CACHE_KEY, JSON.stringify(persistedData));
                }
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to clear expired results from localStorage:', error);
        }
    }

    /**
     * Get recent previews (for recovery UI)
     * @param {number} limit - Maximum number of previews to return
     * @returns {Array} Array of recent preview objects
     */
    getRecentPreviews(limit = 5) {
        const previews = [];
        const currentTime = Date.now();

        // Collect from memory cache
        for (const [requestId, expirationTime] of this.previewCacheTimestamps.entries()) {
            if (currentTime <= expirationTime) {
                previews.push({
                    requestId: requestId,
                    request: this.previewCache.get(requestId),
                    timestamp: expirationTime - this.DEFAULT_PREVIEW_TTL
                });
            }
        }

        // Sort by timestamp (most recent first) and limit
        previews.sort((a, b) => b.timestamp - a.timestamp);
        return previews.slice(0, limit);
    }

    /**
     * Get recent results (for recovery UI)
     * @param {number} limit - Maximum number of results to return
     * @returns {Array} Array of recent result objects
     */
    getRecentResults(limit = 5) {
        const results = [];
        const currentTime = Date.now();

        try {
            const persistedData = this.loadPersistedResults();
            if (persistedData && persistedData.results) {
                for (const requestId in persistedData.results) {
                    if (persistedData.results.hasOwnProperty(requestId)) {
                        const resultData = persistedData.results[requestId];
                        if (currentTime <= resultData.expirationTime) {
                            results.push({
                                requestId: requestId,
                                result: resultData.result,
                                timestamp: resultData.timestamp
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to get recent results:', error);
        }

        // Sort by timestamp (most recent first) and limit
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results.slice(0, limit);
    }

    /**
     * Persist previews to localStorage
     * @private
     */
    persistPreviews() {
        const previews = {};
        for (const [requestId, expirationTime] of this.previewCacheTimestamps.entries()) {
            previews[requestId] = {
                request: this.previewCache.get(requestId),
                expirationTime: expirationTime
            };
        }

        const data = {
            previews: previews,
            lastUpdated: Date.now()
        };

        localStorage.setItem(this.PREVIEW_CACHE_KEY, JSON.stringify(data));
    }

    /**
     * Load persisted previews from localStorage
     * @private
     * @returns {Object} Persisted previews data
     */
    loadPersistedPreviews() {
        try {
            const data = localStorage.getItem(this.PREVIEW_CACHE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to load persisted previews:', error);
        }
        return { previews: {}, lastUpdated: 0 };
    }

    /**
     * Load persisted results from localStorage
     * @private
     * @returns {Object} Persisted results data
     */
    loadPersistedResults() {
        try {
            const data = localStorage.getItem(this.RESULT_CACHE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('[RequestCacheManager] Failed to load persisted results:', error);
        }
        return { results: {}, lastUpdated: 0 };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RequestCacheManager;
}
