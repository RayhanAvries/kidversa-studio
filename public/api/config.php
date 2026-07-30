<?php

declare(strict_types=1);
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Config\AppConfig;
use Kidversa\Config\EnvValidator;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();
header('Content-Type: application/json');

$cacheFile = sys_get_temp_dir() . '/kidversa_config.json';
$cacheTTL = 300;

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false) {
        echo $cached;
        exit;
    }
}

$envErrors = EnvValidator::validate();
if (!empty($envErrors)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Environment configuration errors',
        'errors' => $envErrors,
    ]);
    exit;
}

$response = json_encode([
    'photo' => [
        'width' => AppConfig::PHOTO_WIDTH,
        'height' => AppConfig::PHOTO_HEIGHT,
        'expiry' => AppConfig::PHOTO_EXPIRY_TIME,
    ],
    'session' => [
        'timer' => AppConfig::SESSION_TIMER,
        'cleanupInterval' => AppConfig::CLEANUP_INTERVAL,
    ],
    'studio' => [
        'name' => AppConfig::STUDIO_NAME,
        'location' => AppConfig::STUDIO_LOCATION,
        'email' => AppConfig::STUDIO_EMAIL,
    ],
    'email' => [
        'subject' => AppConfig::EMAIL_SUBJECT,
        'attachmentName' => AppConfig::EMAIL_ATTACHMENT_NAME,
        'gmailOnly' => AppConfig::EMAIL_GMAIL_ONLY,
        'regex' => AppConfig::EMAIL_REGEX,
    ],
    'qr' => [
        'size' => AppConfig::QR_CODE_SIZE,
        'margin' => AppConfig::QR_CODE_MARGIN,
        'logoWidth' => AppConfig::QR_LOGO_WIDTH,
    ],
    'colors' => [
        'primary' => AppConfig::COLOR_PRIMARY,
        'secondary' => AppConfig::COLOR_SECONDARY,
        'accent' => AppConfig::COLOR_ACCENT,
        'dark' => AppConfig::COLOR_DARK,
    ],
    'geolocation' => [
        'timeout' => AppConfig::GEOLOCATION_TIMEOUT,
        'defaultLat' => AppConfig::DEFAULT_LAT,
        'defaultLng' => AppConfig::DEFAULT_LNG,
        'defaultName' => AppConfig::DEFAULT_LOCATION_NAME,
    ],
    'paths' => [
        'frames' => '/assets/img/frames',
        'uploads' => '/uploads/photos/',
    ],
]);

file_put_contents($cacheFile, $response);
echo $response;
