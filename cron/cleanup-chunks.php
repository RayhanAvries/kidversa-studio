<?php

declare(strict_types=1);
require_once __DIR__ . '/../src/bootstrap.php';

use Kidversa\Helpers\ChunkAssemblyHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Services\PhotoService;

// Clean stale chunks
ChunkAssemblyHelper::cleanupStale(3600);

// Clean expired photos
$uploadDir = FileHelper::getUploadDir();
if (is_dir($uploadDir)) {
    $files = scandir($uploadDir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }
        $filePath = $uploadDir . '/' . $file;
        if (is_file($filePath) && PhotoService::isExpired($file, $filePath)) {
            unlink($filePath);
            $metaPath = $uploadDir . '/' . pathinfo($file, PATHINFO_FILENAME) . '.json';
            if (file_exists($metaPath)) {
                unlink($metaPath);
            }
        }
    }
}

echo "Cleanup complete at " . date('Y-m-d H:i:s') . "\n";
