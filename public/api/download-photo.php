<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\PathHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;

SecurityHelper::sendApiSecurityHeaders();

try {
    if (!isset($_GET['file']) || empty($_GET['file'])) {
        throw new Exception('No file specified');
    }

    $filename = $_GET['file'];

    if (!ValidationHelper::validateFilename($filename)) {
        throw new Exception('Invalid filename format');
    }

    $filePath = PathHelper::getSafeUploadPath($filename);

    if (!file_exists($filePath)) {
        throw new Exception('File not found');
    }

    header('Content-Description: File Transfer');
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mimeType = match($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        default => 'application/octet-stream',
    };
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));

    readfile($filePath);
    exit;
} catch (Exception $e) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
