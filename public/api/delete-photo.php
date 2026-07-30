<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\PathHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Services\PhotoService;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!CsrfHelper::validateRequest()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

try {
    if (!isset($_POST['filename']) || empty($_POST['filename'])) {
        throw new Exception('Filename is required');
    }

    $filename = $_POST['filename'];

    if (!ValidationHelper::validateFilename($filename)) {
        throw new Exception('Invalid filename format');
    }

    $filePath = PathHelper::getSafeUploadPath($filename);
    $metaPath = PathHelper::getSafeUploadPath(
        pathinfo($filename, PATHINFO_FILENAME) . '.json'
    );

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            if (file_exists($metaPath)) {
                unlink($metaPath);
            }
            $cacheFile = sys_get_temp_dir() . '/kidversa_list_photos_' . md5(FileHelper::getUploadDir()) . '.json';
            if (file_exists($cacheFile)) {
                unlink($cacheFile);
            }
            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            throw new Exception('Failed to delete file');
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'File not found, nothing to delete']);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
