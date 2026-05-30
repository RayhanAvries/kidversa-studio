<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Services\PhotoService;

try {
    if (!isset($_GET['file']) || empty($_GET['file'])) {
        throw new Exception('No file specified');
    }

    $filename = $_GET['file'];

    if (!PhotoService::validateFilename($filename)) {
        throw new Exception('Invalid filename format');
    }

    $filePath = PhotoService::getPath($filename);

    if (!file_exists($filePath)) {
        throw new Exception('File not found');
    }

    header('Content-Description: File Transfer');
    header('Content-Type: image/png');
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
        'message' => $e->getMessage()
    ]);
}
