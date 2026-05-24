<?php
require_once __DIR__ . '/../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['image']) || empty($input['image'])) {
        throw new Exception('No image data provided');
    }

    $imageData = $input['image'];

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

    $timestamp = date('Ymd_His');
    $filename = AppConfig::PHOTO_PREFIX . $timestamp . '.' . $extension;
    $uploadDir = AppConfig::UPLOAD_PATH;
    $filePath = $uploadDir . $filename;

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if (file_put_contents($filePath, $decodedData) === false) {
        throw new Exception('Failed to save image to disk');
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
