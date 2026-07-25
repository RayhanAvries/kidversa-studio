<?php
declare(strict_types=1);

$rootDir = dirname(__DIR__);

require_once $rootDir . '/vendor/autoload.php';

$envPath = $rootDir . '/.env';
if (file_exists($envPath)) {
    \Kidversa\Helpers\EnvHelper::load($envPath);
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$timezone = \Kidversa\Helpers\EnvHelper::get('APP_TIMEZONE', 'Asia/Jakarta');
date_default_timezone_set($timezone);

if (\Kidversa\Helpers\EnvHelper::get('APP_DEBUG', 'false') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT & ~E_DEPRECATED);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
}

$requiredExtensions = ['gd', 'json', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        error_log("[Bootstrap] Required PHP extension '{$ext}' is not loaded");
    }
}

$uploadDir = \Kidversa\Config\AppConfig::PHOTO_UPLOAD_PATH;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}
