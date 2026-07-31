<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

use Kidversa\Config\AppConfig;

/**
 * Cache management helper for versioned URLs and HTTP cache headers.
 * All methods are static — no dependency injection.
 */
final class CacheHelper
{
    /**
     * Generate versioned URL with query string for cache busting.
     *
     * @param string $path Relative path (e.g., 'assets/css/main.css')
     * @return string Versioned URL (e.g., 'assets/css/main.css?v=4.3.1')
     */
    public static function versionedUrl(string $path): string
    {
        return $path . '?v=' . AppConfig::getAppVersion();
    }

    /**
     * Set Cache-Control headers for HTML pages (PHP-FPM responses).
     * Call this at the top of every PHP page template.
     *
     * Prevents browser/proxy caching of dynamic HTML.
     * Static files (CSS/JS/images) are handled by nginx.conf.
     */
    public static function setHtmlCacheHeaders(): void
    {
        if (headers_sent()) {
            return;
        }

        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }

    /**
     * Set Cache-Control headers for API responses.
     * This duplicates SecurityHelper::sendApiSecurityHeaders() for clarity.
     * New code should use SecurityHelper directly.
     *
     * @deprecated Use SecurityHelper::sendApiSecurityHeaders() instead
     */
    public static function setApiCacheHeaders(): void
    {
        if (headers_sent()) {
            return;
        }

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }
}
