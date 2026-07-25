<?php
namespace Kidversa\Services;

use Kidversa\Config\PhotoConfig;

class FrameService {
    public static function getFrameList(): array {
        $frames = [];
        $dir = PhotoConfig::FRAME_DIR;

        if (is_dir($dir)) {
            $files = scandir($dir);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                    $frames[] = pathinfo($file, PATHINFO_FILENAME);
                }
            }
        }

        return empty($frames) ? PhotoConfig::DEFAULT_FRAMES : $frames;
    }

    public static function getFramePath(string $frameName): string {
        return PhotoConfig::FRAME_DIR . '/' . $frameName . '.png';
    }

    public static function frameExists(string $frameName): bool {
        $path = self::getFramePath($frameName);
        return file_exists($path);
    }
}
