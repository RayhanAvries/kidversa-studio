<?php
namespace Kidversa\Config;

use Kidversa\Helpers\EnvHelper;

class AppConfig {
    public const PHOTO_WIDTH = 1920;
    public const PHOTO_HEIGHT = 1080;
    public const PHOTO_PREFIX = 'kidversa_';
    public const QR_API_URL = 'https://api.qrserver.com/v1/create-qr-code/';
    
    public const FRAME_DIR = __DIR__ . '/../../public/assets/img/frames';
    public const UPLOAD_PATH = __DIR__ . '/../../public/uploads/photos/';
    public const LOGO_PATH = __DIR__ . '/../../public/assets/img/logo.png';
    
    public const DEFAULT_FRAMES = ['kidversa', 'koran'];

    public static function getBaseUrl() {
        return EnvHelper::get('BASE_URL', '');
    }

    public static function getUploadUrl() {
        return self::getBaseUrl() . '/uploads/photos/';
    }

    public static function getFrameUrl() {
        return self::getBaseUrl() . '/assets/img/frames/';
    }
}
