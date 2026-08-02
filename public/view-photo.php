<?php
require_once __DIR__ . '/../src/bootstrap.php';

use Kidversa\Controllers\PhotoController;
use Kidversa\Config\AppConfig;

$filename = $_GET['file'] ?? '';
$data = PhotoController::prepareViewData($filename);

$photoExists = $data['exists'];
$isExpired = $data['expired'];
$fileInfo = $data['fileInfo'];

$formattedDate = $fileInfo['date'] ?? 'Tidak diketahui';
$formattedTime = $fileInfo['time'] ?? 'Tidak diketahui';
$fileSizeStr   = $fileInfo['size'] ?? 'Tidak diketahui';
$dimensionsStr = $fileInfo['dimensions'] ?? 'Tidak diketahui';
$fileExtension = $fileInfo['extension'] ?? 'PNG';

$photoLocation = $fileInfo['location'] ?? null;
if (!$photoLocation || empty($photoLocation['lat']) || empty($photoLocation['lng'])) {
    $photoLocation = [
        'lat' => AppConfig::DEFAULT_LAT,
        'lng' => AppConfig::DEFAULT_LNG,
        'name' => AppConfig::DEFAULT_LOCATION_NAME
    ];
}

$latitude = $photoLocation['lat'];
$longitude = $photoLocation['lng'];
$locationName = $photoLocation['name'];
$mapsUrl = "https://www.google.com/maps?q={$latitude},{$longitude}";
$contactEmail = AppConfig::STUDIO_EMAIL;
$mailtoUrl = 'mailto:' . $contactEmail;
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title><?php echo $photoExists ? 'Foto Kenangan Anda' : 'Foto Tidak Ditemukan'; ?> - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/main.css?v=<?php echo AppConfig::getAppVersion(); ?>">
    <link rel="stylesheet" href="/assets/css/view-photo.css?v=<?php echo AppConfig::getAppVersion(); ?>">
</head>
<body>
    <?php include __DIR__ . '/partials/view-photo/header.php'; ?>

    <main class="main-content">
        <?php if ($photoExists): ?>
            <?php include __DIR__ . '/partials/view-photo/photo-card.php'; ?>
            <?php include __DIR__ . '/partials/view-photo/thank-you.php'; ?>
            <?php include __DIR__ . '/partials/view-photo/contact.php'; ?>
        <?php else: ?>
            <?php include __DIR__ . '/partials/view-photo/error.php'; ?>
        <?php endif; ?>
    </main>

    <div id="toast" class="toast" role="status" aria-live="polite">
        <i class="fas fa-check-circle"></i>
        <span id="toast-message">Tautan berhasil disalin!</span>
    </div>
    
    <script>
    function showToast(message) {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-message');
        msg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function copyToClipboard() {
        const el = document.createElement('textarea');
        el.value = window.location.href;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('Tautan berhasil disalin ke papan klip!');
    }
    </script>
<script>
if ('serviceWorker' in navigator) {
    const SW_VERSION = '<?php echo AppConfig::getAppVersion(); ?>';
    const storedVersion = localStorage.getItem('kidversa_sw_version');
    if (storedVersion && storedVersion !== SW_VERSION) {
        caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).then(() => {
            localStorage.setItem('kidversa_sw_version', SW_VERSION);
            window.location.reload();
        });
    } else {
        localStorage.setItem('kidversa_sw_version', SW_VERSION);
    }
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                reg.addEventListener('updatefound', () => {
                    const w = reg.installing;
                    if (w) w.addEventListener('statechange', () => {
                        if (w.state === 'activated' && !window.__swReloadDone) {
                        window.__swReloadDone = true;
                        window.location.reload();
                    }
                    });
                });
            })
            .catch(() => {});
        navigator.serviceWorker.addEventListener('message', (e) => {
            if (e.data?.type === 'SW_UPDATED' && !window.__swReloadDone) {
            window.__swReloadDone = true;
            window.location.reload();
        }
        });
    });
}
</script>
</body>
</html>
