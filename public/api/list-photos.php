<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Services\PhotoService;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('list-photos', 30, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
    exit;
}

try {
    $uploadDir = FileHelper::getUploadDir();

    if (!is_dir($uploadDir)) {
        echo json_encode([
            'success' => true,
            'photos' => [],
            'total' => 0,
            'total_size' => 0,
            'page' => 1,
            'per_page' => 25,
            'total_pages' => 0,
        ]);
        exit;
    }

    $cacheFile = sys_get_temp_dir() . '/kidversa_list_photos_' . md5($uploadDir) . '.json';
    $cacheTTL = 30;

    $photos = null;
    $fromCache = false;
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            $photos = $cached;
            $fromCache = true;
        }
    }

    if ($photos === null) {
        $files = scandir($uploadDir);
        $photos = [];

        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || $file === '.gitkeep') {
                continue;
            }

            $filePath = $uploadDir . '/' . $file;

            if (!is_file($filePath)) {
                continue;
            }

            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (!in_array($ext, ['png', 'jpg', 'jpeg'], true)) {
                continue;
            }

            if (!ValidationHelper::validateFilename($file)) {
                continue;
            }

            if (PhotoService::isExpired($file, $filePath)) {
                continue;
            }

            $photos[] = [
                'filename' => $file,
                'size' => filesize($filePath),
                'modified' => filemtime($filePath),
                'url' => 'uploads/photos/' . $file,
            ];
        }

        usort($photos, static fn ($a, $b) => $b['modified'] <=> $a['modified']);

        file_put_contents($cacheFile, json_encode($photos));
    }

    $total = count($photos);
    $totalSize = array_sum(array_column($photos, 'size'));

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 25)));
    $totalPages = max(1, (int) ceil($total / $perPage));

    if ($page > $totalPages) {
        $page = $totalPages;
    }

    $offset = ($page - 1) * $perPage;
    $paginatedPhotos = array_slice($photos, $offset, $perPage);

    echo json_encode([
        'success' => true,
        'photos' => $paginatedPhotos,
        'total' => $total,
        'total_size' => $totalSize,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => $totalPages,
        'cached' => $fromCache,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
}
