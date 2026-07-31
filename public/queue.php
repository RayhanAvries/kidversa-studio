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
        <div class="stats-row">
            <span class="stat-item"><i class="fas fa-layer-group"></i> <span id="statTotal">0</span> antrian</span>
            <span class="stat-divider">|</span>
            <span class="stat-item"><i class="fas fa-weight-hanging"></i> <span id="statTotalSize">0 KB</span></span>
            <span class="stat-divider">|</span>
            <span class="stat-item queue-stat-pending"><i class="fas fa-clock"></i> <span id="statPending">0</span> menunggu</span>
            <span class="stat-divider">|</span>
            <span class="stat-item queue-stat-completed"><i class="fas fa-check-circle"></i> <span id="statCompleted">0</span> selesai</span>
            <span class="stat-divider">|</span>
            <span class="stat-item queue-stat-failed"><i class="fas fa-times-circle"></i> <span id="statFailed">0</span> gagal</span>
        </div>
    </div>

    <div class="queue-filters" id="queueFilters" style="display:none">
        <button class="queue-filter-btn active" data-filter="all">Semua</button>
        <button class="queue-filter-btn" data-filter="pending"><i class="fas fa-clock"></i> Proses</button>
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
