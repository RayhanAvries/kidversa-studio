<?php
namespace Kidversa\Config;

class PhotoConfig {
    public const UPLOAD_PATH = __DIR__ . '/../../public/uploads/photos';
    public const FRAME_DIR = __DIR__ . '/../../public/assets/img/frames';
    public const LOGO_PATH = __DIR__ . '/../../public/assets/img/logo.png';

    public const WIDTH = 1920;
    public const HEIGHT = 1080;
    public const EXPIRY_TIME = 3600;
    public const FILENAME_PREFIX = 'kidversa';
    public const TIMESTAMP_FORMAT = 'Ymd_His';

    public const SESSION_TIMER = 90;
    public const CLEANUP_INTERVAL = 30000;

    public const DEFAULT_FRAMES = ['kidversa', 'koran'];
}
