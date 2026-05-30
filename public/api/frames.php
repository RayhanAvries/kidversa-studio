<?php
require_once __DIR__ . '/../../vendor/autoload.php';
use Kidversa\Config\AppConfig;
$frameDir = AppConfig::FRAME_DIR;
$frames = [];
if (is_dir($frameDir)) {
    $files = scandir($frameDir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
            $frames[] = pathinfo($file, PATHINFO_FILENAME);
        }
    }
}
header('Content-Type: application/json');
echo json_encode(['frames' => $frames]);
