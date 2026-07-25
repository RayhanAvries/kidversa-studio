<?php
require_once __DIR__ . '/../../src/bootstrap.php';

use Kidversa\Router;
use Kidversa\Helpers\SecurityHelper;
use Kidversa\Helpers\CsrfHelper;
use Kidversa\Helpers\RateLimitHelper;
use Kidversa\Helpers\ValidationHelper;
use Kidversa\Helpers\PathHelper;
use Kidversa\Helpers\FileHelper;
use Kidversa\Helpers\ResponseHelper;
use Kidversa\Services\PhotoService;
use Kidversa\Services\EmailService;
use Kidversa\Config\AppConfig;
use Kidversa\Config\EnvValidator;

$router = new Router();

$router->addMiddleware(function (callable $next) {
    SecurityHelper::sendApiSecurityHeaders();
    $next();
});

$router->get('/api/config', function () {
    $envErrors = EnvValidator::validate();
    if (!empty($envErrors)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Environment configuration errors',
            'errors' => $envErrors
        ]);
        return;
    }

    header('Content-Type: application/json');
    echo json_encode([
        'photo' => [
            'width' => AppConfig::PHOTO_WIDTH,
            'height' => AppConfig::PHOTO_HEIGHT,
            'expiry' => AppConfig::PHOTO_EXPIRY_TIME
        ],
        'session' => [
            'timer' => AppConfig::SESSION_TIMER,
            'cleanupInterval' => AppConfig::CLEANUP_INTERVAL
        ],
        'studio' => [
            'name' => AppConfig::STUDIO_NAME,
            'location' => AppConfig::STUDIO_LOCATION,
            'email' => AppConfig::STUDIO_EMAIL
        ],
        'email' => [
            'subject' => AppConfig::EMAIL_SUBJECT,
            'attachmentName' => AppConfig::EMAIL_ATTACHMENT_NAME,
            'gmailOnly' => AppConfig::EMAIL_GMAIL_ONLY,
            'regex' => AppConfig::EMAIL_REGEX
        ],
        'qr' => [
            'size' => AppConfig::QR_CODE_SIZE,
            'margin' => AppConfig::QR_CODE_MARGIN,
            'logoWidth' => AppConfig::QR_LOGO_WIDTH
        ],
        'colors' => [
            'primary' => AppConfig::COLOR_PRIMARY,
            'secondary' => AppConfig::COLOR_SECONDARY,
            'accent' => AppConfig::COLOR_ACCENT,
            'dark' => AppConfig::COLOR_DARK
        ],
        'geolocation' => [
            'timeout' => AppConfig::GEOLOCATION_TIMEOUT
        ],
        'paths' => [
            'frames' => '/assets/img/frames'
        ]
    ]);
});

$router->get('/api/frames', function () {
    header('Content-Type: application/json');
    $frameDir = AppConfig::FRAME_DIR;
    $frames = [];
    if (is_dir($frameDir)) {
        $files = scandir($frameDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                $frames[] = pathinfo($file, PATHINFO_FILENAME);
            }
        }
    }
    echo json_encode(['frames' => $frames]);
});

$router->get('/api/csrf-token', function () {
    header('Content-Type: application/json');
    $token = CsrfHelper::generateToken();
    echo json_encode(['success' => true, 'token' => $token]);
});

$router->get('/api/check-photo', function () {
    header('Content-Type: application/json');
    $filename = $_GET['filename'] ?? '';
    if (empty($filename)) {
        echo json_encode(['exists' => false]);
        return;
    }
    if (!ValidationHelper::validateFilename($filename)) {
        echo json_encode(['exists' => false]);
        return;
    }
    $photoPath = FileHelper::getUploadDir() . '/' . $filename;
    echo json_encode(['exists' => file_exists($photoPath)]);
});

$router->get('/api/download-photo', function () {
    try {
        if (!isset($_GET['file']) || empty($_GET['file'])) {
            throw new \Exception('No file specified');
        }
        $filename = $_GET['file'];
        if (!ValidationHelper::validateFilename($filename)) {
            throw new \Exception('Invalid filename format');
        }
        $filePath = PathHelper::getSafeUploadPath($filename);
        if (!file_exists($filePath)) {
            throw new \Exception('File not found');
        }
        header('Content-Description: File Transfer');
        header('Content-Type: image/png');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } catch (\Exception $e) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
});

$router->get('/api/generate-qr', function () {
    if (!RateLimitHelper::isAllowed('generate-qr', 20, 60)) {
        http_response_code(429);
        echo "Rate limit exceeded. Please try again later.";
        return;
    }
    try {
        if (!isset($_GET['filename']) || empty($_GET['filename'])) {
            throw new \Exception('Filename is required');
        }
        $filename = trim($_GET['filename']);
        if (!ValidationHelper::validateFilename($filename)) {
            throw new \Exception('Invalid filename format');
        }
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $downloadUrl = "$protocol://$host/view-photo.php?file={$filename}";
        
        $qrCode = new \Endroid\QrCode\QrCode(
            data: $downloadUrl,
            encoding: new \Endroid\QrCode\Encoding\Encoding('UTF-8'),
            errorCorrectionLevel: \Endroid\QrCode\ErrorCorrectionLevel::High,
            size: 300,
            margin: 10,
            roundBlockSizeMode: \Endroid\QrCode\RoundBlockSizeMode::Margin
        );
        $writer = new \Endroid\QrCode\Writer\PngWriter();
        $logoPath = __DIR__ . '/../assets/img/logo.png';
        if (file_exists($logoPath)) {
            $logo = new \Endroid\QrCode\Logo\Logo(path: $logoPath, resizeToWidth: 60);
            $result = $writer->write($qrCode, $logo);
        } else {
            $result = $writer->write($qrCode);
        }
        header('Content-Type: image/png');
        echo $result->getString();
        exit;
    } catch (\Exception $e) {
        http_response_code(400);
        echo "Error generating QR: " . $e->getMessage();
    }
});

$router->post('/api/save-photo', function () {
    if (!RateLimitHelper::isAllowed('save-photo', 10, 60)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
        return;
    }
    if (!CsrfHelper::validateRequest()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
        return;
    }
    try {
        if (!isset($_FILES['image'])) {
            throw new \Exception('No image file uploaded');
        }
        $validationErrors = ValidationHelper::validateUploadedFile($_FILES['image']);
        if (!empty($validationErrors)) {
            throw new \Exception(implode(', ', $validationErrors));
        }
        $file = $_FILES['image'];
        $filename = PhotoService::generateFilename();
        $uploadDir = FileHelper::getUploadDir();
        $filePath = $uploadDir . '/' . $filename;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        if (move_uploaded_file($file['tmp_name'], $filePath) === false) {
            throw new \Exception('Failed to save image to disk');
        }
        $locationLat = $_POST['location_lat'] ?? null;
        $locationLng = $_POST['location_lng'] ?? null;
        $locationName = $_POST['location_name'] ?? null;
        if ($locationLat && $locationLng) {
            $metaPath = $uploadDir . '/' . pathinfo($filename, PATHINFO_FILENAME) . '.json';
            $metaData = [
                'location' => [
                    'lat' => $locationLat,
                    'lng' => $locationLng,
                    'name' => $locationName ?? 'Unknown'
                ]
            ];
            file_put_contents($metaPath, json_encode($metaData));
        }
        echo json_encode(['success' => true, 'filename' => $filename]);
    } catch (\Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
});

$router->post('/api/delete-photo', function () {
    if (!CsrfHelper::validateRequest()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Invalid CSRF token']);
        return;
    }
    try {
        if (!isset($_POST['filename']) || empty($_POST['filename'])) {
            throw new \Exception('Filename is required');
        }
        $filename = $_POST['filename'];
        if (!ValidationHelper::validateFilename($filename)) {
            throw new \Exception('Invalid filename format');
        }
        $filePath = PathHelper::getSafeUploadPath($filename);
        if (file_exists($filePath)) {
            if (unlink($filePath)) {
                echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
            } else {
                throw new \Exception('Failed to delete file');
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'File not found, nothing to delete']);
        }
    } catch (\Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
});

$router->post('/api/send-email', function () {
    if (!RateLimitHelper::isAllowed('send-email', 5, 60)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
        return;
    }
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new \Exception('Invalid input data');
        }
        $csrfToken = $input['csrf_token'] ?? null;
        if (!CsrfHelper::validateToken($csrfToken)) {
            throw new \Exception('Invalid CSRF token');
        }
        $email = $input['email'] ?? '';
        $filename = $input['filename'] ?? '';
        if (empty($filename)) {
            throw new \Exception('Filename is required');
        }
        if (!ValidationHelper::validateFilename($filename)) {
            throw new \Exception('Invalid filename format');
        }
        $photoPath = FileHelper::getUploadDir() . '/' . $filename;
        if (!file_exists($photoPath)) {
            throw new \Exception('Photo file not found');
        }
        $result = EmailService::sendPhotoEmail($email, $photoPath);
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Email sent successfully!']);
        } else {
            throw new \Exception('Failed to send email');
        }
    } catch (\Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
});

$router->get('/api/cleanup-photos', function () {
    if (!RateLimitHelper::isAllowed('cleanup-photos', 1, 30)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Rate limit exceeded.']);
        return;
    }
    try {
        $uploadDir = FileHelper::getUploadDir();
        if (!is_dir($uploadDir)) {
            echo json_encode(['success' => true, 'hasFiles' => false, 'message' => 'Upload directory does not exist']);
            return;
        }
        $files = scandir($uploadDir);
        $fileCount = 0;
        $deletedCount = 0;
        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || $file === '.gitkeep') {
                continue;
            }
            $filePath = $uploadDir . '/' . $file;
            if (!is_file($filePath)) {
                continue;
            }
            $fileCount++;
            if (PhotoService::isExpired($file, $filePath)) {
                if (unlink($filePath)) {
                    $deletedCount++;
                }
            }
        }
        echo json_encode([
            'success' => true,
            'hasFiles' => $fileCount > 0,
            'deletedCount' => $deletedCount,
            'message' => "Successfully cleaned up. Deleted $deletedCount photo(s)."
        ]);
    } catch (\Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'hasFiles' => false, 'message' => $e->getMessage()]);
    }
});

$router->dispatch();
