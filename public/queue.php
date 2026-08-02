<?php
require_once __DIR__ . '/../src/bootstrap.php';
use Kidversa\Config\AppConfig;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Queue - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/capture.css?v=<?php echo AppConfig::getAppVersion(); ?>">
    <style>
        html, body { overflow: auto; height: auto; }
    </style>
</head>
<body>
<div class="queue-page">
    <?php $activePage = 'queue'; include __DIR__ . '/partials/app-header.php'; ?>

    <div class="queue-stats" id="queueStats" style="display:none">
        <div class="stats-grid">
            <div class="stat-card stat-card-total">
                <div class="stat-card-icon"><i class="fas fa-layer-group"></i></div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statTotal">0</span>
                    <span class="stat-card-label">Antrian</span>
                </div>
            </div>
            <div class="stat-card stat-card-size">
                <div class="stat-card-icon"><i class="fas fa-weight-hanging"></i></div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statTotalSize">0 KB</span>
                    <span class="stat-card-label">Ukuran</span>
                </div>
            </div>
            <div class="stat-card stat-card-pending">
                <div class="stat-card-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statPending">0</span>
                    <span class="stat-card-label">Menunggu</span>
                </div>
            </div>
            <div class="stat-card stat-card-completed">
                <div class="stat-card-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statCompleted">0</span>
                    <span class="stat-card-label">Selesai</span>
                </div>
            </div>
            <div class="stat-card stat-card-failed">
                <div class="stat-card-icon"><i class="fas fa-times-circle"></i></div>
                <div class="stat-card-content">
                    <span class="stat-card-value" id="statFailed">0</span>
                    <span class="stat-card-label">Gagal</span>
                </div>
            </div>
        </div>
    </div>

    <div class="queue-filters" id="queueFilters" style="display:none">
        <button class="queue-filter-btn active" data-filter="all">Semua</button>
        <button class="queue-filter-btn" data-filter="captured"><i class="fas fa-camera"></i> Tangkap</button>
        <button class="queue-filter-btn" data-filter="pending"><i class="fas fa-clock"></i> Antrian</button>
        <button class="queue-filter-btn" data-filter="uploading"><i class="fas fa-upload"></i> Upload</button>
        <button class="queue-filter-btn" data-filter="completed"><i class="fas fa-check"></i> Selesai</button>
        <button class="queue-filter-btn" data-filter="failed"><i class="fas fa-times"></i> Gagal</button>
    </div>

    <div class="queue-content" id="queueContent" style="display:none">
        <div class="queue-list" id="queueList"></div>
    </div>

    <div class="queue-empty" id="queueEmpty" style="display:none">
        <i class="fas fa-check-circle"></i>
        <p>Antrian kosong.<br>Semua operasi telah selesai.</p>
    </div>

    <div class="queue-footer" id="queueFooter" style="display:none">
        <button class="queue-footer-btn queue-footer-select" id="queueSelectAll">
            <i class="fas fa-check-double"></i> Pilih Semua
        </button>
        <button class="queue-footer-btn queue-footer-delete" id="queueDeleteSelected" disabled>
            <i class="fas fa-trash-alt"></i> Hapus <span id="queueDeleteCount"></span>
        </button>
    </div>
</div>
<script type="module">
    import { QueuePage } from './assets/js/modules/QueuePage.js';
    const queue = new QueuePage();
    queue.init();
</script>
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
