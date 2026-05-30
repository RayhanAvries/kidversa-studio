<?php
namespace Kidversa\Controllers;

use Kidversa\Services\PhotoService;
use Kidversa\Config\AppConfig;

class PhotoController
{
    public static function prepareViewData(string $filename): array
    {
        $data = [
            'exists' => false,
            'expired' => false,
            'fileInfo' => null
        ];

        if (!empty($filename) && PhotoService::validateFilename($filename)) {
            $data['fileInfo'] = PhotoService::formatFileInfo($filename);
            if ($data['fileInfo']['exists']) {
                $data['expired'] = $data['fileInfo']['expired'];
                $data['exists'] = !$data['expired'];
            } else {
                $data['expired'] = preg_match('/_(\d{8}_\d{6})\./', $filename) === 1;
            }
        }

        return $data;
    }
}
