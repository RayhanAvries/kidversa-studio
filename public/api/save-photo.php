<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Services\PhotoService;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

SecurityHelper::sendRateLimitHeaders('save-photo', 30);
if (!RateLimitHelper::isAllowed('save-photo', 30, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded. Please try again later.']);
    exit;
}

if (!CsrfHelper::validateRequest()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

try {
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file uploaded');
    }

    $validationErrors = ValidationHelper::validateUploadedFile($_FILES['image']);
    if (!empty($validationErrors)) {
        throw new Exception(implode(', ', $validationErrors));
    }

    $file = $_FILES['image'];
    $filename = PhotoService::generateFilename();
    $uploadDir = FileHelper::getUploadDir();
    $filePath = $uploadDir . '/' . $filename;

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    if (move_uploaded_file($file['tmp_name'], $filePath) === false) {
        throw new Exception('Failed to save image to disk');
    }

    $locationLat = $_POST['location_lat'] ?? null;
    $locationLng = $_POST['location_lng'] ?? null;
    $locationName = $_POST['location_name'] ?? null;

    if ($locationLat && $locationLng) {
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
