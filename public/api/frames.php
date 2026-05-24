<?php
require_once __DIR__ . '/../../src/Config/AppConfig.php';
require_once __DIR__ . '/../../src/Helpers/FileHelper.php';

use Kidversa\Helpers\FileHelper;

header('Content-Type: application/json');
echo json_encode(['frames' => FileHelper::getFrameList()]);