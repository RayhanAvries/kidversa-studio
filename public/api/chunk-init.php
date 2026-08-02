<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\ValidationHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

SecurityHelper::sendRateLimitHeaders('chunk-init', 30);
if (!RateLimitHelper::isAllowed('chunk-init', 30, 60)) {
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

    $filename = $input['filename'] ?? '';
    $totalChunks = (int) ($input['total_chunks'] ?? 0);
    $totalSize = (int) ($input['total_size'] ?? 0);
    $uploadId = $input['upload_id'] ?? '';

    if (empty($filename) || $totalChunks <= 0 || $totalSize <= 0 || empty($uploadId)) {
        throw new Exception('Missing required fields: filename, total_chunks, total_size, upload_id');
    }

    if (!ValidationHelper::validateFilename($filename)) {
        throw new Exception('Invalid filename format');
    }

    if ($totalChunks > 100) {
        throw new Exception('Too many chunks. Maximum is 100.');
    }

    if ($totalSize > 50 * 1024 * 1024) {
        throw new Exception('File too large. Maximum upload size is 50MB.');
    }

    $meta = ChunkAssemblyHelper::initSession($uploadId, $filename, $totalChunks, $totalSize);

    echo json_encode([
        'success' => true,
        'upload_id' => $meta['upload_id'],
        'message' => 'Upload session initialized',
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
