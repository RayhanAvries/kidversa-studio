<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Queue - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/capture.css">
    <style>
        html, body { overflow: auto; height: auto; }
    </style>
</head>
<body>
<div class="queue-page">
    <?php $activePage = 'queue'; include __DIR__ . '/partials/app-header.php'; ?>
    <div class="queue-content" id="queueContent" style="display:none">
        <div class="queue-list" id="queueList"></div>
    </div>
    <div class="queue-empty" id="queueEmpty" style="display:none">
        <i class="fas fa-check-circle"></i>
        <p>Antrian kosong.<br>Semua operasi telah selesai.</p>
    </div>
    <div class="queue-footer" id="queueFooter">
        <button class="queue-btn-clear" id="queueClearAll"><i class="fas fa-trash-alt"></i> &nbsp;Hapus Selesai & Gagal</button>
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
    const SW_VERSION = '4.2.1';
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
                        if (w.state === 'activated') window.location.reload();
                    });
                });
            })
            .catch(() => {});
        navigator.serviceWorker.addEventListener('message', (e) => {
            if (e.data?.type === 'SW_UPDATED') window.location.reload();
        });
    });
}
</script>
</body>
</html>
