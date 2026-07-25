<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Kidversa\Services\EmailService;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\RateLimitHelper;

header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('send-email', 5, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded. Please try again later.']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid input data');
    }

    $csrfToken = $input['csrf_token'] ?? null;
    if (!CsrfHelper::validateToken($csrfToken)) {
        throw new Exception('Invalid CSRF token');
    }

    $email = $input['email'] ?? '';
    $filename = $input['filename'] ?? '';

    if (empty($filename)) {
        throw new Exception('Filename is required');
    }

    if (!ValidationHelper::validateFilename($filename)) {
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