<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

class CsrfHelper
{
    private const TOKEN_LENGTH = 32;
    private const TOKEN_NAME = 'csrf_token';

    public static function generateToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $_SESSION[self::TOKEN_NAME] = $token;
        return $token;
    }

    public static function getToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION[self::TOKEN_NAME])) {
            return self::generateToken();
        }
        return $_SESSION[self::TOKEN_NAME];
    }

    public static function validateToken(?string $token): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($token) || empty($_SESSION[self::TOKEN_NAME])) {
            return false;
        }
        return hash_equals($_SESSION[self::TOKEN_NAME], $token);
    }

    public static function getTokenField(): string
    {
        $token = self::getToken();
        return '<input type="hidden" name="' . self::TOKEN_NAME . '" value="' . htmlspecialchars($token) . '">';
    }

    public static function getTokenFromRequest(): ?string
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            return $_POST[self::TOKEN_NAME] ?? null;
        }
        return null;
    }

    public static function validateRequest(): bool
    {
        $token = self::getTokenFromRequest();
        return self::validateToken($token);
    }
}
