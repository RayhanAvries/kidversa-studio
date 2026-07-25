<?php
namespace Kidversa\Config;

class AppConfig {
    public const PHOTO_UPLOAD_PATH = PhotoConfig::UPLOAD_PATH;
    public const FRAME_DIR = PhotoConfig::FRAME_DIR;
    public const LOGO_PATH = PhotoConfig::LOGO_PATH;

    public const PHOTO_WIDTH = PhotoConfig::WIDTH;
    public const PHOTO_HEIGHT = PhotoConfig::HEIGHT;
    public const PHOTO_EXPIRY_TIME = PhotoConfig::EXPIRY_TIME;
    public const PHOTO_FILENAME_PREFIX = PhotoConfig::FILENAME_PREFIX;
    public const PHOTO_TIMESTAMP_FORMAT = PhotoConfig::TIMESTAMP_FORMAT;

    public const SESSION_TIMER = PhotoConfig::SESSION_TIMER;
    public const CLEANUP_INTERVAL = PhotoConfig::CLEANUP_INTERVAL;

    public const STUDIO_NAME = StudioConfig::NAME;
    public const STUDIO_LOCATION = StudioConfig::LOCATION;
    public const STUDIO_PHONE = StudioConfig::PHONE;
    public const STUDIO_PHONE_LINK = StudioConfig::PHONE_LINK;
    public const STUDIO_EMAIL = StudioConfig::EMAIL;
    public const APP_URL = StudioConfig::APP_URL;
    public const DEFAULT_LAT = StudioConfig::DEFAULT_LAT;
    public const DEFAULT_LNG = StudioConfig::DEFAULT_LNG;
    public const DEFAULT_LOCATION_NAME = StudioConfig::DEFAULT_LOCATION_NAME;

    public const EMAIL_SUBJECT = EmailConfig::SUBJECT;
    public const EMAIL_ATTACHMENT_NAME = EmailConfig::ATTACHMENT_NAME;
    public const EMAIL_GMAIL_ONLY = EmailConfig::GMAIL_ONLY;
    public const EMAIL_REGEX = EmailConfig::REGEX;
    public const EMAIL_ALT_BODY = EmailConfig::ALT_BODY;

    public const GEOLOCATION_TIMEOUT = UiConfig::GEOLOCATION_TIMEOUT;

    public const QR_CODE_SIZE = UiConfig::QR_CODE_SIZE;
    public const QR_CODE_MARGIN = UiConfig::QR_CODE_MARGIN;
    public const QR_LOGO_WIDTH = UiConfig::QR_LOGO_WIDTH;

    public const COLOR_PRIMARY = UiConfig::COLOR_PRIMARY;
    public const COLOR_SECONDARY = UiConfig::COLOR_SECONDARY;
    public const COLOR_ACCENT = UiConfig::COLOR_ACCENT;
    public const COLOR_DARK = UiConfig::COLOR_DARK;

    public const MONTHS_INDONESIAN = StudioConfig::MONTHS_INDONESIAN;
    public const DAYS_INDONESIAN = StudioConfig::DAYS_INDONESIAN;

    public const DEFAULT_FRAMES = PhotoConfig::DEFAULT_FRAMES;
}
