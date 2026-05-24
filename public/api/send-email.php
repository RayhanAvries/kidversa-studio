<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../../vendor/autoload.php';
require '../../src/Helpers/EnvHelper.php';
require '../../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

use Kidversa\Helpers\EnvHelper;

header('Content-Type: application/json');

try {
    EnvHelper::load(__DIR__ . '/../../.env');

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid input data');
    }

    $email = $input['email'] ?? '';
    $imageBase64 = $input['image'] ?? '';
    $metadata = $input['metadata'] ?? [];

    if (empty($email) || !preg_match('/^[a-z0-9._%+-]+@gmail\.com$/i', $email)) {
        throw new Exception('Please provide a valid @gmail.com email address');
    }

    if (empty($imageBase64)) {
        throw new Exception('Image data is missing');
    }

    $imageData = str_replace('data:image/png;base64,', '', $imageBase64);
    $imageData = str_replace(' ', '+', $imageData);
    $imageBinary = base64_decode($imageData);

    if (!$imageBinary) {
        throw new Exception('Failed to decode image data');
    }

    $tempFile = sys_get_temp_dir() . '/kidversa_' . uniqid() . '.png';
    file_put_contents($tempFile, $imageBinary);

    $mail = new PHPMailer(true);
    $mail->CharSet = 'UTF-8';

    $mail->isSMTP();
    $mail->Host       = EnvHelper::get('SMTP_HOST');
    $mail->SMTPAuth   = true;
    $mail->Username   = EnvHelper::get('SMTP_USER');
    $mail->Password   = EnvHelper::get('SMTP_PASS');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = EnvHelper::get('SMTP_PORT', 587);

    $mail->setFrom(EnvHelper::get('SMTP_FROM'), 'Kidversa Studio');
    $mail->addAddress($email);

    $mail->addAttachment($tempFile, 'my_kidversa_photo.png');

    $mail->isHTML(true);
    $mail->Subject = 'Foto Kidversa Studio Anda Sudah Siap! 📸';

    $timestamp = $metadata['timestamp'] ?? date('Y-m-d H:i:s');
    $location = $metadata['location'] ?? 'Not available';

    $mail->Body = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>
        <div style='text-align: center; margin-bottom: 20px;'>
            <img src='cid:logo_img' style='max-width: 200px; margin-bottom: 20px;'>
            <h2 style='color: #6B46C1;'>Terima Kasih Telah Mengunjungi Kidversa Studio!</h2>
            <p style='color: #666;'>Kami telah mengabadikan momen spesial untuk Anda. Berikut adalah softfile foto Anda.</p>
        </div>
        <div style='text-align: center; margin-bottom: 20px;'>
            <img src='cid:photo_img' style='max-width: 100%; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);'>
        </div>
        <div style='background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 12px; color: #888; line-height: 1.6;'>
            <strong>Detail Foto:</strong><br>
            Email: {$email}<br>
            Waktu Pengambilan: {$timestamp}<br>
            Lokasi: {$location}
        </div>
        <div style='text-align: center; margin-top: 20px; font-size: 14px; color: #aaa;'>
            &copy; " . date('Y') . " Kidversa Studio.
        </div>
    </div>
    ";
    $mail->AltBody = "Terima kasih telah mengunjungi Kidversa Studio! Foto Anda terlampir dalam email ini.\n\nWaktu Pengambilan: {$timestamp}\nLokasi: {$location}";

    $mail->addEmbeddedImage($tempFile, 'photo_img');
    $mail->addEmbeddedImage(AppConfig::LOGO_PATH, 'logo_img');

    $mail->send();

    if (file_exists($tempFile)) {
        unlink($tempFile);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully!'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
