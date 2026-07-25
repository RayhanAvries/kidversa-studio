<?php
namespace Kidversa\Config;

class AppConfig {
    public const PHOTO_UPLOAD_PATH = __DIR__ . '/../../public/uploads/photos';
    public const FRAME_DIR = __DIR__ . '/../../public/assets/img/frames';
    public const LOGO_PATH = __DIR__ . '/../../public/assets/img/logo.png';

    public const PHOTO_WIDTH = 1920;
    public const PHOTO_HEIGHT = 1080;
    public const PHOTO_EXPIRY_TIME = 3600;
    public const PHOTO_FILENAME_PREFIX = 'kidversa';
    public const PHOTO_TIMESTAMP_FORMAT = 'Ymd_His';

    public const SESSION_TIMER = 90;
    public const CLEANUP_INTERVAL = 30000;

    public const STUDIO_NAME = 'Kidversa Studio';
    public const STUDIO_LOCATION = 'Bandung, Indonesia';
    public const DEFAULT_LAT = -6.9175;
    public const DEFAULT_LNG = 107.6191;
    public const DEFAULT_LOCATION_NAME = 'Bandung';
    public const STUDIO_EMAIL = 'kidversafun@gmail.com';

    public const EMAIL_SUBJECT = 'Foto Kidversa Studio Anda Sudah Siap! 📸';
    public const EMAIL_ATTACHMENT_NAME = 'my_kidversa_photo.png';
    public const EMAIL_GMAIL_ONLY = true;
    public const EMAIL_REGEX = '/^[a-z0-9._%+-]+@gmail\.com$/i';
    public const EMAIL_ALT_BODY = "Terima kasih telah mengunjungi Kidversa Studio! Foto Anda terlampir dalam email ini.\n\nWaktu Pengambilan: {timestamp}\nLokasi: {location}";

    public const GEOLOCATION_TIMEOUT = 5000;

    public const QR_CODE_SIZE = 300;
    public const QR_CODE_MARGIN = 10;
    public const QR_LOGO_WIDTH = 60;

    public const COLOR_PRIMARY = '#4F46E5';
    public const COLOR_SECONDARY = '#06B6D4';
    public const COLOR_ACCENT = '#EF4444';
    public const COLOR_DARK = '#111827';

    public const MONTHS_INDONESIAN = [
        '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
        '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
        '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
    ];

    public const DAYS_INDONESIAN = [
        'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];

    public const DEFAULT_FRAMES = ['kidversa', 'koran'];
}
