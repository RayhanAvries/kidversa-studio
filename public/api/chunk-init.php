<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('chunk-upload', 10, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
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
