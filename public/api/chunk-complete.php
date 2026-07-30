<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('chunk-complete', 10, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid input data');
    }

    $csrfToken = $input['csrf_token'] ?? null;
    if (!CsrfHelper::validateToken($csrfToken)) {
        throw new Exception('Invalid CSRF token');
    }

    $uploadId = $input['upload_id'] ?? '';
    $locationLat = $input['location_lat'] ?? null;
    $locationLng = $input['location_lng'] ?? null;
    $locationName = $input['location_name'] ?? null;

    if (empty($uploadId)) {
        throw new Exception('Missing upload_id');
    }

    $filename = ChunkAssemblyHelper::assemble($uploadId);

    if (!$filename) {
        throw new Exception('Failed to assemble chunks. Some chunks may be missing.');
    }

    if ($locationLat && $locationLng) {
        $uploadDir = FileHelper::getUploadDir();
        $metaPath = $uploadDir . '/' . pathinfo($filename, PATHINFO_FILENAME) . '.json';
        $metaData = [
            'location' => [
                'lat' => $locationLat,
                'lng' => $locationLng,
                'name' => $locationName ?? 'Unknown',
            ],
        ];
        file_put_contents($metaPath, json_encode($metaData));
    }

    $cacheFile = sys_get_temp_dir() . '/kidversa_list_photos_' . md5(FileHelper::getUploadDir()) . '.json';
    if (file_exists($cacheFile)) {
        unlink($cacheFile);
    }

    echo json_encode([
        'success' => true,
        'filename' => $filename,
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
