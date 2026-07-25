<?php
namespace Kidversa\Helpers;

class EnvHelper {
    private static $loadedEnv = [];

    public static function load($path) {
        if (!file_exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || $trimmed[0] === '#') {
                continue;
            }
            $parts = explode('=', $trimmed, 2);
            if (count($parts) === 2) {
                [$name, $value] = $parts;
                self::$loadedEnv[trim($name)] = trim($value);
            }
        }
        return true;
    }

    public static function get($name, $default = null) {
        return self::$loadedEnv[$name] ?? $default;
    }
}

