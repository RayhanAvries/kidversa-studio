<?php
namespace Kidversa\Helpers;

use Kidversa\Config\AppConfig;
use Kidversa\Services\FrameService;

class FileHelper {
    public static function getUploadDir(): string {
        return AppConfig::PHOTO_UPLOAD_PATH;
    }
    
    public static function getFrameList(): array {
        return FrameService::getFrameList();
    }
}
