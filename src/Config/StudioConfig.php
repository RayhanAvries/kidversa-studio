<?php

declare(strict_types=1);

namespace Kidversa\Config;

class StudioConfig
{
    public const NAME = 'Kidversa Studio';
    public const LOCATION = 'Bandung, Indonesia';
    public const PHONE = '+62 812-2218-9918';
    public const PHONE_LINK = '+6281222189918';
    public const EMAIL = 'kidversafun@gmail.com';
    public const APP_URL = 'https://www.kidversa.fun';
    public const DEFAULT_LAT = -6.9175;
    public const DEFAULT_LNG = 107.6191;
    public const DEFAULT_LOCATION_NAME = 'Bandung';

    public const MONTHS_INDONESIAN = [
        '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
        '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
        '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
    ];

    public const DAYS_INDONESIAN = [
        'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
    ];
}
