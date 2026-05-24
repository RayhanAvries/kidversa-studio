<?php
require_once __DIR__ . '/../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

header('Content-Type: application/json');

try {
    // Tentukan upload directory relatif terhadap lokasi file PHP ini dijalankan (web server vs CLI)
    $uploadDir = AppConfig::UPLOAD_PATH;
    
    if (!is_dir($uploadDir)) {
        echo json_encode([
            'success' => true,
            'message' => 'Upload directory does not exist: ' . $uploadDir
        ]);
        exit;
    }

    $files = scandir($uploadDir);
    $deletedCount = 0;
    $now = time();
    $maxAgeSeconds = 60 * 60; // 60 minutes

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }

        $filePath = $uploadDir . $file;
        
        if (!is_file($filePath)) {
            continue;
        }

        // Ambil timestamp dari nama file (format: kidversa_Ymd_His.png)
        // Contoh: kidversa_20260524_130930.png
        $timestampStr = '';
        if (preg_match('/_(\d{8}_\d{6})\./', $file, $matches)) {
            $timestampStr = $matches[1];
        }

        $fileTime = null;
        if (!empty($timestampStr)) {
            // Parse Ymd_His
            $dateTime = DateTime::createFromFormat('Ymd_His', $timestampStr);
            if ($dateTime) {
                $fileTime = $dateTime->getTimestamp();
            }
        }

        // Fallback jika format nama file tidak sesuai, gunakan file modification time (mtime)
        if (!$fileTime) {
            $fileTime = filemtime($filePath);
        }

        if ($fileTime && ($now - $fileTime) > $maxAgeSeconds) {
            if (unlink($filePath)) {
                $deletedCount++;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully cleaned up. Deleted $deletedCount photo(s)."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
