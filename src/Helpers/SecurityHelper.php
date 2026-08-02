<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

class SecurityHelper
{
    public static function sendSecurityHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)');

        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://cdn.jsdelivr.net;");
        }
    }

    public static function sendApiSecurityHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }

    public static function sendRateLimitHeaders(string $key, int $maxRequests): void
    {
        $remaining = RateLimitHelper::getRemaining($key);
        $retryAfter = RateLimitHelper::getRetryAfter($key);
        $limit = $maxRequests;
        $reset = time() + $retryAfter;

        header("X-RateLimit-Limit: {$limit}");
        header("X-RateLimit-Remaining: {$remaining}");
        header("X-RateLimit-Reset: {$reset}");

        if ($remaining <= 0) {
            header("Retry-After: {$retryAfter}");
        }
    }

    public static function setCorsHeaders(string $allowedOrigin = '*'): void
    {
        header("Access-Control-Allow-Origin: $allowedOrigin");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Max-Age: 86400');
    }
}
