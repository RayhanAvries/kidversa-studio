<?php
namespace Kidversa\Helpers;

class EnvHelper {
    private static $env = [];

    public static function load($path) {
        if (!file_exists($path)) {
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;

            list($name, $value) = explode('=', $line, 2);
            self::$env[trim($name)] = trim($value);
        }
        return true;
    }

    public static function get($name, $default = null) {
        return self::$env[$name] ?? $default;
    }
}
