<?php

declare(strict_types=1);

namespace Kidversa\Services;

use Kidversa\Config\AppConfig;
use Kidversa\Helpers\EnvHelper;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    private static function getMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';
        $mail->isSMTP();
        $mail->Host = EnvHelper::get('SMTP_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = EnvHelper::get('SMTP_USER');
        $mail->Password = EnvHelper::get('SMTP_PASS');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = EnvHelper::get('SMTP_PORT', 587);
        $mail->setFrom(EnvHelper::get('SMTP_FROM'), AppConfig::STUDIO_NAME);

        return $mail;
    }

    private static function getEmailTemplate(string $email, string $timestamp, string $location): string
    {
        return "
        <div style='font-family: \"Plus Jakarta Sans\", system-ui, sans-serif; max-width: 600px; margin: 20px auto; background: #FFFFFF; border-radius: 22px; padding: 40px; border: 1px solid #E5E7EB; box-shadow: 0 12px 40px rgba(0,0,0,0.08);'>
            <div style='text-align: center; margin-bottom: 30px;'>
                <img src='cid:logo_img' style='max-width: 150px;'>
                <h2 style='color: #1F2937; margin-top: 20px;'>Terima Kasih Telah Mengunjungi " . AppConfig::STUDIO_NAME . "!</h2>
                <p style='color: #6B7280; font-size: 16px;'>Berikut adalah hasil foto kenangan Anda.</p>
            </div>

            <div style='text-align: center; margin-bottom: 30px;'>
                <img src='cid:photo_img' style='max-width: 100%; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.06);'>
            </div>

            <div style='background: #FAFAFA; padding: 20px; border-radius: 12px; border: 1px solid #F0F0F0; color: #1F2937;'>
                <h3 style='margin-top: 0; color: #A855F7;'>Detail Foto</h3>
                <p style='margin: 5px 0;'><strong>Waktu:</strong> {$timestamp}</p>
                <p style='margin: 5px 0;'><strong>Lokasi:</strong> <a href='https://www.google.com/maps/search/?api=1&query=" . urlencode($location) . "' style='color: #A855F7; text-decoration: none;'>{$location}</a></p>
            </div>

            <div style='text-align: center; margin-top: 30px;'>
                <p style='color: #6B7280; font-size: 14px;'>Butuh bantuan? Silahkan hubungi kami di:</p>
                <a href='" . AppConfig::APP_URL . "/contact' style='display: inline-block; background: linear-gradient(135deg, #A855F7, #7C3AED); color: #FFFFFF; padding: 12px 24px; border-radius: 60px; text-decoration: none; font-weight: bold;'>Hubungi Kami</a>
            </div>

            <div style='text-align: center; margin-top: 40px; font-size: 12px; color: #9CA3AF;'>
                &copy; " . date('Y') . ' ' . AppConfig::STUDIO_NAME . '. Semua hak dilindungi.
            </div>
        </div>
        ';
    }

    private static function getAltBody(string $timestamp, string $location): string
    {
        return str_replace(
            ['{timestamp}', '{location}'],
            [$timestamp, $location],
            AppConfig::EMAIL_ALT_BODY
        );
    }

    public static function sendPhotoEmail(string $email, string $photoPath): bool
    {
        if (!preg_match(AppConfig::EMAIL_REGEX, $email)) {
            throw new Exception('Please provide a valid @gmail.com email address');
        }

        if (!file_exists($photoPath)) {
            throw new Exception('Photo file not found');
        }

        try {
            $mail = self::getMailer();
            $mail->addAddress($email);
            $mail->addAttachment($photoPath, AppConfig::EMAIL_ATTACHMENT_NAME);

            $timestamp = date('Y-m-d H:i:s');
            $location = AppConfig::STUDIO_LOCATION;

            $mail->isHTML(true);
            $mail->Subject = AppConfig::EMAIL_SUBJECT;
            $mail->Body = self::getEmailTemplate($email, $timestamp, $location);
            $mail->AltBody = self::getAltBody($timestamp, $location);

            $mail->addEmbeddedImage($photoPath, 'photo_img');
            $logoPath = AppConfig::LOGO_PATH;
            if (file_exists($logoPath)) {
                $mail->addEmbeddedImage($logoPath, 'logo_img');
            }

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log('Email send failed: ' . $e->getMessage());
            return false;
        }
    }
}
