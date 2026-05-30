<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Services\EmailService;

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid input data');
    }

    $email = $input['email'] ?? '';
    $imageBase64 = $input['image'] ?? '';
    $metadata = $input['metadata'] ?? [];

    $result = EmailService::sendPhotoEmail($email, $imageBase64, $metadata);

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

