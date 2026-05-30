<?php
namespace Kidversa\Services;

use Kidversa\Config\AppConfig;
use Kidversa\Helpers\FileHelper;

class PhotoService {
    public static function getPath(string $filename): string {
        return FileHelper::getUploadDir() . '/' . $filename;
    }
    
    public static function isExpired(string $filename, ?string $filePath = null): bool {
        if (!$filePath) {
            $filePath = self::getPath($filename);
        }
        
        if (!file_exists($filePath)) {
            return true;
        }
        
        $fileTime = self::extractTimestampFromFilename($filename);
        if (!$fileTime) {
            $fileTime = filemtime($filePath);
        }
        
        if (!$fileTime) {
            return false;
        }
        
        return (time() - $fileTime) > AppConfig::PHOTO_EXPIRY_TIME;
    }
    
    public static function extractTimestampFromFilename(string $filename): ?int {
        if (preg_match('/_(\d{8}_\d{6})\./', $filename, $matches)) {
            $timestampStr = $matches[1];
            $dateTime = \DateTime::createFromFormat(AppConfig::PHOTO_TIMESTAMP_FORMAT, $timestampStr);
            if ($dateTime) {
                return $dateTime->getTimestamp();
            }
        }
        return null;
    }
    
    public static function formatFileInfo(string $filename, ?string $filePath = null): array {
        if (!$filePath) {
            $filePath = self::getPath($filename);
        }
        
        $info = [
            'exists' => false,
            'expired' => false,
            'date' => 'Tidak diketahui',
            'time' => 'Tidak diketahui',
            'size' => 'Tidak diketahui',
            'dimensions' => 'Tidak diketahui',
            'extension' => 'PNG'
        ];
        
        if (!file_exists($filePath)) {
            return $info;
        }
        
        $info['exists'] = true;
        
        if (self::isExpired($filename, $filePath)) {
            $info['expired'] = true;
            return $info;
        }
        
        
        $timestamp = filemtime($filePath);
        if ($timestamp !== false) {
            $dt = new \DateTime("@$timestamp");
            $dt->setTimezone(new \DateTimeZone('Asia/Jakarta'));
            $dayOfWeek = AppConfig::DAYS_INDONESIAN[$dt->format('w')];
            $month = $dt->format('m');
            $year = $dt->format('Y');
            $day = $dt->format('d');
            $hour = $dt->format('H');
            $minute = $dt->format('i');
            $second = $dt->format('s');
            $monthName = AppConfig::MONTHS_INDONESIAN[$month] ?? $month;
            
            $info['date'] = "$dayOfWeek, $day $monthName $year";
            $info['time'] = "$hour:$minute:$second WIB";
        }
        
        
        $bytes = filesize($filePath);
        if ($bytes >= 1048576) {
            $info['size'] = number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            $info['size'] = number_format($bytes / 1024, 1) . ' KB';
        } else {
            $info['size'] = $bytes . ' B';
        }
        
        
        $imageInfo = getimagesize($filePath);
        if ($imageInfo !== false) {
            $info['dimensions'] = $imageInfo[0] . ' x ' . $imageInfo[1] . ' px';
        }
        
        
        $pathInfo = pathinfo($filePath);
        $info['extension'] = strtoupper($pathInfo['extension'] ?? 'PNG');
        
        
        $metaPath = FileHelper::getUploadDir() . '/' . pathinfo($filename, PATHINFO_FILENAME) . '.json';
        if (file_exists($metaPath)) {
            $metaData = json_decode(file_get_contents($metaPath), true);
            if (is_array($metaData) && isset($metaData['location'])) {
                $info['location'] = $metaData['location'];
            }
        }
        
        return $info;
    }
    
    public static function validateFilename(string $filename): bool {
        return !preg_match('/[^a-zA-Z0-9._-]/', $filename);
    }
    
    public static function generateFilename(): string {
        $dt = new \DateTime('now', new \DateTimeZone('Asia/Jakarta'));
        $timestamp = $dt->format(AppConfig::PHOTO_TIMESTAMP_FORMAT);
        return AppConfig::PHOTO_FILENAME_PREFIX . '_' . $timestamp . '.png';
    }
}
