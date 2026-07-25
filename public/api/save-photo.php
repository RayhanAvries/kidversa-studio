<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Services\PhotoService;

header('Content-Type: application/json');

try {
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file uploaded');
    }

    $file = $_FILES['image'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }

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
                'name' => $locationName ?? 'Unknown'
            ]
        ];
        file_put_contents($metaPath, json_encode($metaData));
    }

    echo json_encode([
        'success' => true,
        'filename' => $filename
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
