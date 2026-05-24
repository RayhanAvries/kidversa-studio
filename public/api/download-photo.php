<?php
require_once __DIR__ . '/../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

header('Content-Type: application/json');

try {
    if (!isset($_GET['file']) || empty($_GET['file'])) {
        throw new Exception('No file specified');
    }

    $filename = $_GET['file'];

    if (preg_match('/[^a-zA-Z0-9._-]/', $filename)) {
        throw new Exception('Invalid filename format');
    }

    $uploadDir = AppConfig::UPLOAD_PATH;
    $filePath = $uploadDir . $filename;

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
