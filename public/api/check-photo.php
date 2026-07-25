<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Helpers\FileHelper;

header('Content-Type: application/json');

try {
    $filename = $_GET['filename'] ?? '';

    if (empty($filename)) {
        echo json_encode(['exists' => false]);
        exit;
    }

    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $filename)) {
        echo json_encode(['exists' => false]);
        exit;
    }

    $photoPath = FileHelper::getUploadDir() . '/' . $filename;
    $exists = file_exists($photoPath);

    echo json_encode(['exists' => $exists]);
} catch (Exception $e) {
    echo json_encode(['exists' => false]);
}
