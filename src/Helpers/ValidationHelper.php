<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

class ValidationHelper
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024;
    private const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    private const FILENAME_PATTERN = '/^[a-zA-Z0-9._-]+$/';
    private const EMAIL_PATTERN = '/^[a-z0-9._%+-]+@gmail\.com$/i';

    public static function validateFilename(string $filename): bool
    {
        if (empty($filename)) {
            return false;
        }
        return preg_match(self::FILENAME_PATTERN, $filename) === 1;
    }

    public static function validateEmail(string $email): bool
    {
        if (empty($email)) {
            return false;
        }
        return preg_match(self::EMAIL_PATTERN, $email) === 1;
    }

    public static function validateUploadedFile(array $file): array
    {
        $errors = [];

        if (!isset($file['error']) || \is_array($file['error'])) {
            $errors[] = 'Invalid file upload parameters';
            return $errors;
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errors[] = 'File exceeds maximum upload size';
                return $errors;
            case UPLOAD_ERR_PARTIAL:
                $errors[] = 'File was only partially uploaded';
                return $errors;
            case UPLOAD_ERR_NO_FILE:
                $errors[] = 'No file was uploaded';
                return $errors;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errors[] = 'Missing temporary folder';
                return $errors;
            case UPLOAD_ERR_CANT_WRITE:
                $errors[] = 'Failed to write file to disk';
                return $errors;
            case UPLOAD_ERR_EXTENSION:
                $errors[] = 'A PHP extension stopped the file upload';
                return $errors;
            default:
                $errors[] = 'Unknown upload error';
                return $errors;
        }

        if ($file['size'] > self::MAX_FILE_SIZE) {
            $errors[] = 'File size exceeds maximum allowed size';
        }

        if ($file['size'] === 0) {
            $errors[] = 'File is empty';
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!\in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            $errors[] = 'File type not allowed. Only PNG, JPEG, and WebP are accepted';
        }

        return $errors;
    }

    public static function sanitizeInput(string $input): string
    {
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        return $input;
    }

    public static function sanitizeFilename(string $filename): string
    {
        $filename = basename($filename);
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
        return $filename;
    }
}
