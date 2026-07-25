<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Services\EmailService;
use Kidversa\Helpers\FileHelper;

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid input data');
    }

    $email = $input['email'] ?? '';
    $filename = $input['filename'] ?? '';

    if (empty($filename)) {
        throw new Exception('Filename is required');
    }

    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $filename)) {
        throw new Exception('Invalid filename format');
    }

    $photoPath = FileHelper::getUploadDir() . '/' . $filename;
    if (!file_exists($photoPath)) {
        throw new Exception('Photo file not found');
    }

    $result = EmailService::sendPhotoEmail($email, $photoPath);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully!'
        ]);
    } else {
        throw new Exception('Failed to send email');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}