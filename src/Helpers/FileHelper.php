<?php
namespace Kidversa\Helpers;

use Kidversa\Config\AppConfig;

class FileHelper {
    public static function getUploadDir(): string {
        return AppConfig::UPLOAD_PATH;
    }
    
    public static function getFrameList(): array {
        $frames = [];
        $dir = AppConfig::FRAME_DIR;

        if (is_dir($dir)) {
            $files = scandir($dir);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                    $frames[] = pathinfo($file, PATHINFO_FILENAME);
                }
            }
        }

        return empty($frames) ? AppConfig::DEFAULT_FRAMES : $frames;
    }
}
