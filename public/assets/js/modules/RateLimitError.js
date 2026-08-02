/**
 * Custom error for HTTP 429 rate limit responses.
 * Includes retry timing info from server Retry-After header.
 */
export class RateLimitError extends Error {
    /**
     * @param {string} endpoint - The API endpoint that returned 429
     * @param {number} retryAfter - Seconds until safe to retry (from Retry-After header)
     * @param {string} [message] - Human-readable error message
     */
    constructor(endpoint, retryAfter, message) {
        super(message || `Rate limit exceeded on ${endpoint}. Retry after ${retryAfter}s.`);
        this.name = 'RateLimitError';
        this.status = 429;
        this.endpoint = endpoint;
        this.retryAfter = retryAfter;
    }
}
