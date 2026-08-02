<?php

declare(strict_types=1);

namespace Kidversa\Controllers;

use Kidversa\Services\PhotoService;

class PhotoController
{
    public static function prepareViewData(string $filename): array
    {
        $data = [
            'exists' => false,
            'expired' => false,
            'fileInfo' => null,
        ];

        if (!empty($filename) && PhotoService::validateFilename($filename)) {
            $data['fileInfo'] = PhotoService::formatFileInfo($filename);
            if ($data['fileInfo']['exists']) {
                $data['expired'] = $data['fileInfo']['expired'];
                $data['exists'] = !$data['expired'];
            }
            // If file doesn't exist, expired stays false (default)
            // The view-photo.php template handles "not found" vs "expired" separately
        }

        return $data;
    }
}
