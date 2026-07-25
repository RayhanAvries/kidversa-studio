<?php
require_once __DIR__ . '/../../src/bootstrap.php';

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Logo\Logo;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\SecurityHelper;

SecurityHelper::sendApiSecurityHeaders();

if (!RateLimitHelper::isAllowed('generate-qr', 20, 60)) {
    http_response_code(429);
    echo "Rate limit exceeded. Please try again later.";
    exit;
}

try {
    if (!isset($_GET['filename']) || empty($_GET['filename'])) {
        throw new Exception('Filename is required');
    }

    $filename = $_GET['filename'];
    $filename = trim($filename);

    if (!ValidationHelper::validateFilename($filename)) {
        throw new Exception('Invalid filename format');
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $downloadUrl = "$protocol://$host/view-photo.php?file={$filename}";

    $qrCode = new QrCode(
        data: $downloadUrl,
        encoding: new Encoding('UTF-8'),
        errorCorrectionLevel: ErrorCorrectionLevel::High,
        size: 300,
        margin: 10,
        roundBlockSizeMode: RoundBlockSizeMode::Margin
    );

    $writer = new PngWriter();

    $logoPath = __DIR__ . '/../assets/img/logo.png';
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
