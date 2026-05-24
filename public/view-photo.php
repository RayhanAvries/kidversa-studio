<?php
require_once __DIR__ . '/../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

$filename = isset($_GET['file']) ? $_GET['file'] : '';
$photoExists = false;
$isExpired = false;
$filePath = '';
$formattedDate = 'Tidak diketahui';
$formattedTime = 'Tidak diketahui';
$fileSizeStr = 'Tidak diketahui';
$dimensionsStr = 'Tidak diketahui';
$fileExtension = 'PNG';

if (!empty($filename) && !preg_match('/[^a-zA-Z0-9._-]/', $filename)) {
    $uploadDir = AppConfig::UPLOAD_PATH;
    $filePath = $uploadDir . $filename;
    
    if (file_exists($filePath)) {
        $fileTime = null;
        if (preg_match('/_(\d{8}_\d{6})\./', $filename, $matches)) {
            $timestampStr = $matches[1];
            $dateTime = DateTime::createFromFormat('Ymd_His', $timestampStr);
            if ($dateTime) {
                $fileTime = $dateTime->getTimestamp();
            }
        }
        
            $fileTime = filemtime($filePath);
        
        $maxAgeSeconds = 3600;
        if ($fileTime && (time() - $fileTime) > $maxAgeSeconds) {
            $isExpired = true;
        } else {
            $photoExists = true;
            
            $pathInfo = pathinfo($filePath);
            $fileExtension = strtoupper($pathInfo['extension'] ?? 'PNG');
            
            if (preg_match('/kidversa_(\d{8})_(\d{6})/', $filename, $matches)) {
                $dateStr = $matches[1]; // YYYYMMDD
                $timeStr = $matches[2]; // HHMMSS
                
                $year = substr($dateStr, 0, 4);
                $month = substr($dateStr, 4, 2);
                $day = substr($dateStr, 6, 2);
                
                $hour = substr($timeStr, 0, 2);
                $minute = substr($timeStr, 2, 2);
                $second = substr($timeStr, 4, 2);
                
                $months = [
                    '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
                    '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
                    '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'
                ];
                $monthName = $months[$month] ?? $month;
                
                $timestamp = strtotime("$year-$month-$day $hour:$minute:$second");
                if ($timestamp !== false) {
                    $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    $dayOfWeek = $days[date('w', $timestamp)];
                    $formattedDate = "$dayOfWeek, $day $monthName $year";
                    $formattedTime = "$hour:$minute:$second WIB";
                }
            }
            
            $bytes = filesize($filePath);
            if ($bytes >= 1048576) {
                $fileSizeStr = number_format($bytes / 1048576, 2) . ' MB';
            } elseif ($bytes >= 1024) {
                $fileSizeStr = number_format($bytes / 1024, 1) . ' KB';
            } else {
                $fileSizeStr = $bytes . ' B';
            }
            
            $imageInfo = getimagesize($filePath);
            if ($imageInfo !== false) {
                $dimensionsStr = $imageInfo[0] . ' x ' . $imageInfo[1] . ' px';
            }
        }
    } else {
        if (preg_match('/_(\d{8}_\d{6})\./', $filename)) {
            $isExpired = true;
        }
    }
}

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$currentUrl = "$protocol://$host" . $_SERVER['REQUEST_URI'];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo $photoExists ? 'Foto Kenangan Anda' : 'Foto Tidak Ditemukan'; ?> - Kidversa Studio</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#ff6b6b',
                        secondary: '#feca57',
                        accent: '#a855f7',
                        dark: '#1e293b'
                    },
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <style>
        /* Dot pattern background */
        .dot-pattern {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px);
            background-size: 24px 24px;
            pointer-events: none;
            z-index: 0;
        }

        /* Animated Blobs */
        .blob {
            position: fixed;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
            z-index: 0;
            animation: blobMorph 12s infinite ease-in-out;
            opacity: 0.5;
        }

        .blob-purple {
            width: 350px;
            height: 350px;
            background: rgba(168, 85, 247, 0.15);
            top: -100px;
            right: -80px;
            animation-delay: 0s;
        }

        .blob-yellow {
            width: 300px;
            height: 300px;
            background: rgba(234, 179, 8, 0.12);
            bottom: -80px;
            left: -60px;
            animation-delay: -4s;
            animation-duration: 15s;
        }

        @keyframes blobMorph {
            0%, 100% {
                transform: translate(0, 0) scale(1);
                border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%;
            }
            25% {
                transform: translate(30px, -20px) scale(1.1);
                border-radius: 60% 40% 30% 70% / 40% 60% 30% 70%;
            }
            50% {
                transform: translate(-15px, 30px) scale(0.95);
                border-radius: 30% 70% 50% 50% / 50% 40% 60% 50%;
            }
            75% {
                transform: translate(-30px, -15px) scale(1.05);
                border-radius: 50% 50% 40% 60% / 30% 60% 40% 70%;
            }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-height-screen flex flex-col relative antialiased">
    <div class="dot-pattern"></div>
    <div class="blob blob-purple"></div>
    <div class="blob blob-yellow"></div>

    <header class="w-full py-2 px-3.5 sticky top-0 z-50 border-b border-[#F0F0F0] bg-white/92 backdrop-blur-[16px] flex justify-between items-center min-h-[44px]">
        <div class="flex items-center gap-1.5 text-[clamp(0.75rem,2vw,0.9rem)] font-bold text-[#1F2937] tracking-normal select-none">
            <i class="fas fa-star text-[#EAB308] text-[0.7rem]"></i>
            <span>Kidversa <span class="text-[#A855F7]">Studio</span></span>
        </div>
        
        <div class="flex items-center gap-1.5">
            <a href="/index.php" class="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F5F5F5] border border-[#E8E8E8] text-[#6B7280] hover:text-[#1F2937] font-semibold text-[0.7rem] rounded-full transition-all duration-200 active:scale-[0.94] active:bg-[#EEE] select-none">
                <i class="fas fa-arrow-left"></i>
                <span>Back</span>
            </a>
        </div>
    </header>

    <main class="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12 relative z-10 flex items-center justify-center">
        <?php if ($photoExists): ?>
            <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                <div class="lg:col-span-7 flex flex-col gap-4 w-full">
                    <div class="bg-white p-3 md:p-4 rounded-3xl shadow-xl shadow-slate-100/80 border border-slate-100 transition-all hover:shadow-2xl">
                        <div class="relative overflow-hidden rounded-2xl bg-slate-900 group aspect-[4/3] flex items-center justify-center">
                            <img src="<?php echo AppConfig::getUploadUrl() . htmlspecialchars($filename); ?>"
                                 class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                 alt="Foto Kenangan Kidversa"
                                 id="photoImage">
                            
                            <span class="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-lg tracking-wider">
                                <?php echo htmlspecialchars($fileExtension); ?>
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3 px-4 py-3 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                        <i class="fas fa-info-circle text-primary text-base mt-0.5 shrink-0"></i>
                        <p class="text-xs text-slate-500 leading-relaxed">
                            Foto ini disimpan secara aman di Kidversa Cloud. Silakan unduh atau pindai kode QR untuk menyimpan kenangan ini langsung di galeri handphone Anda.
                        </p>
                    </div>
                </div>

                <div class="lg:col-span-5 flex flex-col gap-6 w-full">
                    
                    <div class="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/80 border border-slate-100 flex flex-col gap-6">
                        
                        <div>
                            <span class="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                                <i class="fas fa-sparkles mr-1"></i> Foto Tersimpan
                            </span>
                            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                                Kenangan Kidversa
                            </h2>
                            <p class="text-sm text-slate-400 mt-1 truncate max-w-full" title="<?php echo htmlspecialchars($filename); ?>">
                                ID: <?php echo htmlspecialchars($filename); ?>
                            </p>
                        </div>

                        <div class="border-t border-slate-100"></div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div class="flex items-start gap-3 col-span-1 sm:col-span-2">
                                <div class="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <i class="far fa-calendar-alt text-base"></i>
                                </div>
                                <div>
                                    <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Tanggal & Waktu</span>
                                    <span class="text-sm text-slate-700 font-bold block mt-0.5">
                                        <?php echo htmlspecialchars($formattedDate); ?>
                                    </span>
                                    <span class="text-xs text-slate-500 block mt-0.5">
                                        <?php echo htmlspecialchars($formattedTime); ?>
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-rose-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <i class="fas fa-map-marker-alt text-base"></i>
                                </div>
                                <div>
                                    <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Lokasi</span>
                                    <span class="text-sm text-slate-700 font-bold block mt-0.5">
                                        Kidversa Studio
                                    </span>
                                    <span class="text-xs text-slate-500 block mt-0.5">
                                        Jakarta, Indonesia
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <i class="fas fa-expand text-base"></i>
                                </div>
                                <div>
                                    <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Dimensi</span>
                                    <span class="text-sm text-slate-700 font-bold block mt-0.5">
                                        <?php echo htmlspecialchars($dimensionsStr); ?>
                                    </span>
                                    <span class="text-xs text-slate-500 block mt-0.5">
                                        Resolusi Tinggi
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <i class="fas fa-hdd text-base"></i>
                                </div>
                                <div>
                                    <span class="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Ukuran File</span>
                                    <span class="text-sm text-slate-700 font-bold block mt-0.5">
                                        <?php echo htmlspecialchars($fileSizeStr); ?>
                                    </span>
                                    <span class="text-xs text-slate-500 block mt-0.5">
                                        Format <?php echo htmlspecialchars($fileExtension); ?>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="border-t border-slate-100"></div>

                        <div class="flex flex-col gap-3">
                            <a href="/api/download-photo.php?file=<?php echo htmlspecialchars($filename); ?>"
                               class="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-primary to-rose-500 hover:from-rose-500 hover:to-primary text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
                               download>
                                <i class="fas fa-cloud-download-alt text-lg"></i>
                                <span>Unduh Kenangan (HD)</span>
                            </a>

                            <button onclick="copyToClipboard()"
                                    class="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-2xl transition-all duration-200">
                                <i class="fas fa-share-alt text-base"></i>
                                <span>Salin Link Bagikan</span>
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-row bg-white rounded-3xl p-5 md:p-6 shadow-xl shadow-slate-100/80 border border-slate-100 items-center gap-4 md:gap-6">
                        <div class="w-24 h-24 md:w-28 md:h-28 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
                            <img src="/api/generate-qr.php?filename=<?php echo urlencode($filename); ?>"
                                 class="w-full h-full object-contain"
                                 alt="QR Code"
                                 onerror="this.src='<?php echo AppConfig::QR_API_URL; ?>?size=150x150&data=<?php echo urlencode($currentUrl); ?>'">
                        </div>
                        <div class="flex-1">
                            <h4 class="font-bold text-slate-800 text-sm md:text-base">Scan di Handphone</h4>
                            <p class="text-[11px] md:text-xs text-slate-500 mt-1 leading-relaxed">
                                Arahkan kamera HP Anda ke QR code ini untuk membuka foto ini dan menyimpannya secara instan ke galeri ponsel Anda.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        <?php elseif ($isExpired): ?>
            <div class="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-xl shadow-slate-100/80 border border-slate-100 relative overflow-hidden">
                <div class="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
                <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl"></div>
                
                <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-inner">
                    <i class="fas fa-history text-3xl"></i>
                </div>
                
                <h2 class="text-2xl font-extrabold text-slate-800 leading-tight">Foto Telah Kadaluarsa</h2>
                <p class="text-slate-500 text-sm mt-3 leading-relaxed">
                    Waktu penyimpanan foto ini telah habis (batas maksimal 60 menit). Demi keamanan privasi Anda, semua file foto di Kidversa Studio akan dihapus secara otomatis dari sistem secara berkala.
                </p>
                
                <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="<?php echo AppConfig::getBaseUrl(); ?>/index.php" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-2xl transition-all">
                        <i class="fas fa-home"></i>
                        <span>Beranda</span>
                    </a>
                    <a href="<?php echo AppConfig::getBaseUrl(); ?>/take-photo.php" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all">
                        <i class="fas fa-camera"></i>
                        <span>Ambil Foto Baru</span>
                    </a>
                </div>
            </div>
        <?php else: ?>
            <div class="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-xl shadow-slate-100/80 border border-slate-100 relative overflow-hidden">
                <div class="absolute -top-12 -left-12 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
                
                <div class="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                    <i class="fas fa-image-slash text-3xl"></i>
                </div>
                
                <h2 class="text-2xl font-extrabold text-slate-800 leading-tight">Foto Tidak Ditemukan</h2>
                <p class="text-slate-500 text-sm mt-3 leading-relaxed">
                    Maaf, berkas foto yang Anda cari tidak ditemukan. Silakan pastikan tautan sudah benar atau lakukan sesi pengambilan foto baru.
                </p>
                
                <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="<?php echo AppConfig::getBaseUrl(); ?>/index.php" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200>
                        <i class="fas fa-home"></i>
                        <span>Beranda</span>
                    </a>
                    <a href="<?php echo AppConfig::getBaseUrl(); ?>/take-photo.php" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all">
                        <i class="fas fa-camera"></i>
                        <span>Ambil Foto</span>
                    </a>
                </div>
            </div>
        <?php endif; ?>
    </main>


    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 pointer-events-none transform translate-y-12 opacity-0 transition-all duration-300">
        <div class="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs shrink-0">
            <i class="fas fa-check"></i>
        </div>
        <span class="text-sm font-semibold tracking-wide">Tautan foto berhasil disalin!</span>
    </div>

    <script>
        function copyToClipboard() {
            const el = document.createElement('textarea');
            el.value = window.location.href;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            // Tampilkan Toast
            const toast = document.getElementById('toast');
            toast.classList.remove('translate-y-12', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            // Sembunyikan setelah 3 detik
            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-12', 'opacity-0');
            }, 3000);
        }
    </script>
</body>
</html>