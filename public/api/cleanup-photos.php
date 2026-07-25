<?php
spl_autoload_register(function ($class) {
    $prefix = 'Kidversa\\';
    $base_dir = __DIR__ . '/../../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Services\PhotoService;

header('Content-Type: application/json');

if (!RateLimitHelper::isAllowed('cleanup-photos', 1, 30)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded. Please try again later.']);
    exit;
}

try {
    $uploadDir = FileHelper::getUploadDir();

    if (!is_dir($uploadDir)) {
        echo json_encode([
            'success' => true,
            'hasFiles' => false,
            'message' => 'Upload directory does not exist: ' . $uploadDir
        ]);
        exit;
    }

    $files = scandir($uploadDir);
    $fileCount = 0;
    $deletedCount = 0;

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }

        $filePath = $uploadDir . '/' . $file;

        if (!is_file($filePath)) {
            continue;
        }

        $fileCount++;

        if (PhotoService::isExpired($file, $filePath)) {
            if (unlink($filePath)) {
                $deletedCount++;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'hasFiles' => $fileCount > 0,
        'deletedCount' => $deletedCount,
        'message' => "Successfully cleaned up. Deleted $deletedCount photo(s)."
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'hasFiles' => false,
        'message' => $e->getMessage()
    ]);
}
