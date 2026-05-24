<?php
require_once __DIR__ . '/../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

header('Content-Type: application/json');

try {
    if (!isset($_POST['filename']) || empty($_POST['filename'])) {
        throw new Exception('Filename is required');
    }

    $filename = $_POST['filename'];

    if (preg_match('/[^a-zA-Z0-9._-]/', $filename)) {
        throw new Exception('Invalid filename format');
    }

    $uploadDir = AppConfig::UPLOAD_PATH;
    $filePath = $uploadDir . $filename;

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
