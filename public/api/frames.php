<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Config\AppConfig;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

$cacheFile = sys_get_temp_dir() . '/kidversa_frames.json';
$cacheTTL = 300;

$frames = null;
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if (is_array($cached)) {
        $frames = $cached;
    }
}

if ($frames === null) {
    $frameDir = AppConfig::FRAME_DIR;
    $frames = [];
    if (is_dir($frameDir)) {
        $files = scandir($frameDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                $frames[] = pathinfo($file, PATHINFO_FILENAME);
            }
        }
    }
    file_put_contents($cacheFile, json_encode($frames));
}

echo json_encode(['success' => true, 'frames' => $frames]);
