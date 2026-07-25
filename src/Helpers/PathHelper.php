<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

use Kidversa\Config\AppConfig;

class PathHelper
{
    public static function safePath(string $filename, string $allowedDir): string
    {
        $filename = basename($filename);
        $realAllowedDir = realpath($allowedDir);

        if ($realAllowedDir === false) {
            throw new \RuntimeException('Allowed directory does not exist');
        }

        $fullPath = $realAllowedDir . \DIRECTORY_SEPARATOR . $filename;
        $realFullPath = realpath($fullPath);

        if ($realFullPath === false) {
            return $fullPath;
        }

        if (strpos($realFullPath, $realAllowedDir) !== 0) {
            throw new \RuntimeException('Path traversal attempt detected');
        }

        return $realFullPath;
    }

    public static function isPathSafe(string $path, string $allowedDir): bool
    {
        $realAllowedDir = realpath($allowedDir);
        if ($realAllowedDir === false) {
            return false;
        }

        $realPath = realpath($path);
        if ($realPath === false) {
            return false;
        }

        return strpos($realPath, $realAllowedDir) === 0;
    }

    public static function getSafeUploadPath(string $filename): string
    {
        $uploadDir = AppConfig::PHOTO_UPLOAD_PATH;
        return self::safePath($filename, $uploadDir);
    }

    public static function isWithinUploadDir(string $path): bool
    {
        return self::isPathSafe($path, AppConfig::PHOTO_UPLOAD_PATH);
    }
}
