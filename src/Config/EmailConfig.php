<?php
namespace Kidversa\Config;

class EmailConfig {
    public const SUBJECT = 'Foto Kidversa Studio Anda Sudah Siap! 📸';
    public const ATTACHMENT_NAME = 'my_kidversa_photo.png';
    public const GMAIL_ONLY = true;
    public const REGEX = '/^[a-z0-9._%+-]+@gmail\.com$/i';
    public const ALT_BODY = "Terima kasih telah mengunjungi Kidversa Studio! Foto Anda terlampir dalam email ini.\n\nWaktu Pengambilan: {timestamp}\nLokasi: {location}";
}
