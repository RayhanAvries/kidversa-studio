<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\PathHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body']);
    exit;
}
$csrfToken = $input['csrf_token'] ?? null;
if (!CsrfHelper::validateToken($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
    exit;
}

try {
    if (!isset($input['old_filename']) || empty($input['old_filename'])) {
        throw new Exception('Old filename is required');
    }
    if (!isset($input['new_filename']) || empty($input['new_filename'])) {
        throw new Exception('New filename is required');
    }

    $oldFilename = $input['old_filename'];
    $newFilename = $input['new_filename'];

    if (!ValidationHelper::validateFilename($oldFilename)) {
        throw new Exception('Invalid old filename format');
    }
    if (!ValidationHelper::validateFilename($newFilename)) {
        throw new Exception('Invalid new filename format');
    }

    $oldPath = PathHelper::getSafeUploadPath($oldFilename);
    $newPath = PathHelper::getSafeUploadPath($newFilename);

    if (!file_exists($oldPath)) {
        throw new Exception('Source file not found');
    }
    if (file_exists($newPath)) {
        throw new Exception('A file with that name already exists');
    }

    if (rename($oldPath, $newPath)) {
        $oldMetaPath = PathHelper::getSafeUploadPath(
            pathinfo($oldFilename, PATHINFO_FILENAME) . '.json'
        );
        $newMetaPath = PathHelper::getSafeUploadPath(
            pathinfo($newFilename, PATHINFO_FILENAME) . '.json'
        );
        if (file_exists($oldMetaPath)) {
            rename($oldMetaPath, $newMetaPath);
        }
        $cacheFile = sys_get_temp_dir() . '/kidversa_list_photos_' . md5(FileHelper::getUploadDir()) . '.json';
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
        echo json_encode([
            'success' => true,
            'message' => 'File renamed successfully',
            'new_filename' => $newFilename,
        ]);
    } else {
        throw new Exception('Failed to rename file');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
