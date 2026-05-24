<?php
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Logo\Logo;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;

try {
    if (!isset($_GET['filename']) || empty($_GET['filename'])) {
        throw new Exception('Filename is required');
    }

    $filename = $_GET['filename'];

    if (preg_match('/[^a-zA-Z0-9._-]/', $filename)) {
        throw new Exception('Invalid filename format');
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $downloadUrl = "$protocol://$host/view-photo.php?file=$filename";

    $qrCode = new QrCode(
        data: $downloadUrl,
        encoding: new Encoding('UTF-8'),
        errorCorrectionLevel: ErrorCorrectionLevel::High,
        size: 300,
        margin: 10,
        roundBlockSizeMode: RoundBlockSizeMode::Margin
    );

    $writer = new PngWriter();

    $logoPath = AppConfig::LOGO_PATH;
    if (file_exists($logoPath)) {
        $logo = new Logo(
            path: $logoPath,
            resizeToWidth: 60
        );
        
        $result = $writer->write($qrCode, $logo);
    } else {
        $result = $writer->write($qrCode);
    }

    header('Content-Type: image/png');
    echo $result->getString();
    exit;

} catch (Exception $e) {
    http_response_code(400);
    echo "Error generating QR: " . $e->getMessage();
}
