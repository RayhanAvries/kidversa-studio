<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('chunk-upload', 50, 60)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
    exit;
}

try {
    if (!isset($_POST['upload_id']) || !isset($_POST['chunk_index'])) {
        throw new Exception('Missing upload_id or chunk_index');
    }

    $csrfToken = $_POST['csrf_token'] ?? null;
    if (!CsrfHelper::validateToken($csrfToken)) {
        throw new Exception('Invalid CSRF token');
    }

    $uploadId = $_POST['upload_id'];
    $chunkIndex = (int) $_POST['chunk_index'];

    if (!isset($_FILES['chunk'])) {
        throw new Exception('No chunk file uploaded');
    }

    $chunkData = file_get_contents($_FILES['chunk']['tmp_name']);
    if ($chunkData === false) {
        throw new Exception('Failed to read chunk data');
    }

    $result = ChunkAssemblyHelper::addChunk($uploadId, $chunkIndex, $chunkData);

    if (!$result) {
        throw new Exception('Failed to store chunk. Upload session may be invalid.');
    }

    $progress = ChunkAssemblyHelper::getProgress($uploadId);

    echo json_encode([
        'success' => true,
        'chunk_index' => $chunkIndex,
        'progress' => $progress,
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
