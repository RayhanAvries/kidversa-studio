<?php
namespace Kidversa\Helpers;

class RateLimitHelper {
    private const STORAGE_DIR = __DIR__ . '/../../storage/ratelimit';

    public static function isAllowed(string $key, int $maxRequests, int $windowSeconds): bool {
        $rateLimitDir = self::getStorageDir();
        if (!is_dir($rateLimitDir)) {
            mkdir($rateLimitDir, 0755, true);
        }

        $file = $rateLimitDir . '/' . md5($key) . '.json';
        $now = time();

        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && ($now - $data['window_start']) < $windowSeconds) {
                if ($data['count'] >= $maxRequests) {
                    return false;
                }
                $data['count']++;
                file_put_contents($file, json_encode($data));
                return true;
            }
        }

        $data = [
            'window_start' => $now,
            'count' => 1
        ];
        file_put_contents($file, json_encode($data));
        return true;
    }

    public static function recordRequest(string $key): void {
        self::isAllowed($key, PHP_INT_MAX, PHP_INT_MAX);
    }

    public static function cleanup(int $maxAge = 3600): void {
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

    private static function getStorageDir(): string {
        return self::STORAGE_DIR;
    }
}
