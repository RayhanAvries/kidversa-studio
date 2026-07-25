<?php

declare(strict_types=1);

namespace Kidversa\Config;

use Kidversa\Helpers\EnvHelper;

class EnvValidator
{
    private const REQUIRED_VARS = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_FROM',
        'BASE_URL',
        'STUDIO_EMAIL',
    ];

    private const OPTIONAL_VARS = [
        'APP_DEBUG' => 'false',
        'APP_ENV' => 'production',
    ];

    public static function validate(): array
    {
        $errors = [];
        $warnings = [];

        $envPath = self::getEnvPath();
        if (!file_exists($envPath)) {
            $errors[] = '.env file not found at: ' . $envPath;
            return $errors;
        }

        EnvHelper::load($envPath);

        foreach (self::REQUIRED_VARS as $var) {
            $value = EnvHelper::get($var);
            if (empty($value)) {
                $errors[] = "Required environment variable '{$var}' is missing or empty";
            }
        }

        foreach (self::OPTIONAL_VARS as $var => $default) {
            $value = EnvHelper::get($var);
            if (empty($value)) {
                $warnings[] = "Optional environment variable '{$var}' not set, using default: '{$default}'";
            }
        }

        $baseUrl = EnvHelper::get('BASE_URL');
        if (!empty($baseUrl) && filter_var($baseUrl, FILTER_VALIDATE_URL) === false) {
            $errors[] = "BASE_URL is not a valid URL: '{$baseUrl}'";
        }

        $smtpPort = EnvHelper::get('SMTP_PORT');
        if (!empty($smtpPort) && (!is_numeric($smtpPort) || $smtpPort < 1 || $smtpPort > 65535)) {
            $errors[] = "SMTP_PORT must be a valid port number (1-65535): '{$smtpPort}'";
        }

        if (!empty($warnings)) {
            error_log('[EnvValidator] Warnings: ' . implode('; ', $warnings));
        }

        return $errors;
    }

    public static function getRequiredVars(): array
    {
        return self::REQUIRED_VARS;
    }

    public static function getOptionalVars(): array
    {
        return self::OPTIONAL_VARS;
    }

    public static function isValid(): bool
    {
        return empty(self::validate());
    }

    private static function getEnvPath(): string
    {
        $rootDir = \dirname(__DIR__, 2);
        return $rootDir . \DIRECTORY_SEPARATOR . '.env';
    }
}
