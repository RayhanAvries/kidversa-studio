<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Services\PhotoService;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

SecurityHelper::sendRateLimitHeaders('cleanup-photos', 10);
if (!RateLimitHelper::isAllowed('cleanup-photos', 10, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded. Please try again later.']);
    exit;
}

$csrfToken = $_GET['csrf_token'] ?? null;
if (!CsrfHelper::validateToken($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

try {
    ChunkAssemblyHelper::cleanupStale(3600);

    $uploadDir = FileHelper::getUploadDir();

    if (!is_dir($uploadDir)) {
        echo json_encode([
            'success' => true,
            'hasFiles' => false,
            'deletedCount' => 0,
            'message' => 'No photos to clean up.',
        ]);
        exit;
    }

    $files = scandir($uploadDir);
    $fileCount = 0;
    $deletedCount = 0;

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }

        $filePath = $uploadDir . '/' . $file;

        if (!is_file($filePath)) {
            continue;
        }

        $fileCount++;

        if (PhotoService::isExpired($file, $filePath)) {
            if (unlink($filePath)) {
                $deletedCount++;
                $metaPath = $uploadDir . '/' . pathinfo($file, PATHINFO_FILENAME) . '.json';
                if (file_exists($metaPath)) {
                    unlink($metaPath);
                }
            }
        }
    }

    $cacheFile = sys_get_temp_dir() . '/kidversa_list_photos_' . md5($uploadDir) . '.json';
    if (file_exists($cacheFile)) {
        unlink($cacheFile);
    }

    echo json_encode([
        'success' => true,
        'hasFiles' => $fileCount > 0,
        'deletedCount' => $deletedCount,
        'message' => "Successfully cleaned up. Deleted $deletedCount photo(s).",
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'hasFiles' => false,
        'message' => $e->getMessage(),
    ]);
}
