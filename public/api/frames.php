<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Config\AppConfig;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();

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
header('Content-Type: application/json');
echo json_encode(['frames' => $frames]);
