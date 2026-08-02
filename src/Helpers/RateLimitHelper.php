<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

class RateLimitHelper
{
    private const STORAGE_DIR = __DIR__ . '/../../storage/ratelimit';

    public static function isAllowed(string $key, int $maxRequests, int $windowSeconds): bool
    {
        $rateLimitDir = self::getStorageDir();
        if (!is_dir($rateLimitDir)) {
            mkdir($rateLimitDir, 0755, true);
        }

        $file = $rateLimitDir . '/' . md5($key) . '.json';
        $now = time();

        $fp = fopen($file, 'c+');
        if (!$fp) {
            return false;
        }

        flock($fp, LOCK_EX);

        $raw = stream_get_contents($fp);
        $data = json_decode($raw ?: '{}', true);

        if ($data && ($now - ($data['window_start'] ?? 0)) < $windowSeconds) {
            if (($data['count'] ?? 0) >= $maxRequests) {
                flock($fp, LOCK_UN);
                fclose($fp);
                return false;
            }
            $data['count'] = ($data['count'] ?? 0) + 1;
        } else {
            $data = [
                'window_start' => $now,
                'count' => 1,
            ];
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return true;
    }

    public static function getRemaining(string $key, int $maxRequests, int $windowSeconds = 60): int
    {
        $data = self::readRateLimitData($key) ?? [];

        $now = time();
        $windowStart = $data['window_start'] ?? 0;
        $count = $data['count'] ?? 0;

        // Window has expired — full capacity available
        if (($now - $windowStart) >= $windowSeconds) {
            return $maxRequests;
        }

        return max(0, $maxRequests - $count);
    }

    public static function getRetryAfter(string $key, int $windowSeconds = 60): int
    {
        $data = self::readRateLimitData($key) ?? [];

        $now = time();
        $windowStart = $data['window_start'] ?? 0;
        $elapsed = $now - $windowStart;

        $remaining = $windowSeconds - $elapsed;

        return max(0, (int) $remaining);
    }

    public static function recordRequest(string $key): void
    {
        self::isAllowed($key, PHP_INT_MAX, PHP_INT_MAX);
    }

    public static function cleanup(int $maxAge = 3600): void
    {
        $rateLimitDir = self::getStorageDir();
        if (!is_dir($rateLimitDir)) {
            return;
        }

        $files = glob($rateLimitDir . '/*.json');
        $now = time();

        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && ($now - $data['window_start']) > $maxAge) {
                unlink($file);
            }
        }
    }

    private static function readRateLimitData(string $key): ?array
    {
        $rateLimitDir = self::getStorageDir();
        $file = $rateLimitDir . '/' . md5($key) . '.json';

        if (!file_exists($file)) {
            return null;
        }

        $fp = fopen($file, 'r');
        if (!$fp) {
            return null;
        }

        flock($fp, LOCK_SH);
        $raw = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return json_decode($raw ?: '{}', true);
    }

    private static function getStorageDir(): string
    {
        return self::STORAGE_DIR;
    }
}
