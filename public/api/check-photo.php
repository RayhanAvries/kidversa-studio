<?php
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

try {
    $filename = $_GET['filename'] ?? '';

    if (empty($filename)) {
        echo json_encode(['exists' => false]);
        exit;
    }

    if (!ValidationHelper::validateFilename($filename)) {
        echo json_encode(['exists' => false]);
        exit;
    }

    $photoPath = FileHelper::getUploadDir() . '/' . $filename;
    $exists = file_exists($photoPath);

    echo json_encode(['exists' => $exists]);
} catch (Exception $e) {
    echo json_encode(['exists' => false]);
}
