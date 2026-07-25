<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('check-queue', 20, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !is_array($input['filenames'] ?? null)) {
        throw new Exception('Invalid input: filenames array required');
    }

    $csrfToken = $input['csrf_token'] ?? null;
    if (!CsrfHelper::validateToken($csrfToken)) {
        throw new Exception('Invalid CSRF token');
    }

    $filenames = $input['filenames'];

    if (count($filenames) > 50) {
        throw new Exception('Too many filenames. Maximum 50 per request.');
    }

    $uploadDir = FileHelper::getUploadDir();
    $results = [];

    foreach ($filenames as $filename) {
        if (!is_string($filename) || !ValidationHelper::validateFilename($filename)) {
            $results[] = ['filename' => (string) $filename, 'exists' => false];
            continue;
        }

        $filePath = $uploadDir . '/' . $filename;
        $results[] = [
            'filename' => $filename,
            'exists' => file_exists($filePath),
        ];
    }

    echo json_encode(['success' => true, 'results' => $results]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
