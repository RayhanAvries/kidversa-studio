<?php
require_once __DIR__ . '/../src/bootstrap.php';
use Kidversa\Config\AppConfig;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Gallery - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/capture.css?v=<?php echo AppConfig::getAppVersion(); ?>">
    <style>
        html, body { overflow: auto; height: auto; }
    </style>
</head>
<body>
<div class="gallery-page">
    <?php $activePage = 'gallery'; include __DIR__ . '/partials/app-header.php'; ?>
    <div class="gallery-stats" id="galleryStats" style="display:none">
        <div class="stats-cards">
            <div class="stat-card stat-card-photos">
                <div class="stat-card-icon">
                    <i class="fas fa-images"></i>
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statTotal">0</span>
                    <span class="stat-card-label">Total Foto</span>
                </div>
            </div>
            <div class="stat-card stat-card-size">
                <div class="stat-card-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statSize">0 KB</span>
                    <span class="stat-card-label">Ukuran</span>
                </div>
            </div>
            <div class="stat-card stat-card-showing">
                <div class="stat-card-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-value"><span id="statShowing">0</span> <span class="stat-card-of">dari</span> <span id="statOfTotal">0</span></span>
                    <span class="stat-card-label">Ditampilkan</span>
                </div>
            </div>
        </div>
    </div>
    <div class="gallery-content">
        <div class="gallery-loading" id="galleryLoading">
            <i class="fas fa-spinner fa-spin"></i>&nbsp; Memuat foto...
        </div>
        <div class="gallery-grid" id="galleryGrid" style="display:none"></div>
        <div class="gallery-empty" id="galleryEmpty" style="display:none">
            <i class="fas fa-images"></i>
            <p>Belum ada foto.<br>Ambil foto pertama Anda!</p>
            <a href="take-photo.php" class="btn-cta"><i class="fas fa-camera"></i> &nbsp;Take Photo</a>
        </div>
        <div class="gallery-pagination" id="galleryPagination" style="display:none"></div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script type="module">
    import { GalleryPage } from './assets/js/modules/GalleryPage.js';
    const gallery = new GalleryPage();
    gallery.init();
</script>
<?php include 'partials/modals/print-modal.php'; ?>
<?php include 'partials/modals/qr-modal.php'; ?>
<?php include 'partials/modals/email-modal.php'; ?>
<?php include 'partials/footer.php'; ?>
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
