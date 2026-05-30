<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Services\PhotoService;

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['image']) || empty($input['image'])) {
        throw new Exception('No image data provided');
    }

    $imageData = $input['image'];
    $locationMeta = $input['metadata']['location'] ?? null;

    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
        $extension = strtolower($type[1]);
    } else {
        $extension = 'png';
    }

    $decodedData = base64_decode($imageData);
    if ($decodedData === false) {
        throw new Exception('Invalid base64 data');
    }

    $filename = PhotoService::generateFilename();
    $uploadDir = FileHelper::getUploadDir();
    $filePath = $uploadDir . '/' . $filename;

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (file_put_contents($filePath, $decodedData) === false) {
        throw new Exception('Failed to save image to disk');
    }
    if ($locationMeta) {
        $metaPath = $uploadDir . '/' . pathinfo($filename, PATHINFO_FILENAME) . '.json';
        $metaData = ['location' => $locationMeta];
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
