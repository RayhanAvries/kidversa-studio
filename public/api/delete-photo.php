<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\ValidationHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Services\PhotoService;

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

    $filePath = PhotoService::getPath($filename);

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
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
        'message' => $e->getMessage()
    ]);
}
