<?php
require_once __DIR__ . '/../src/bootstrap.php';
use Kidversa\Config\AppConfig;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Capture - Kidversa Studio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/capture.css?v=<?php echo AppConfig::getAppVersion(); ?>">
</head>
<body>
<div class="app">
    <?php $activePage = 'take-photo'; include __DIR__ . '/partials/app-header.php'; ?>
    <div class="main-content">
        <div class="main-area" id="mainArea">
            <div class="photo-wrap">
                <div class="photo-box" id="photoBox">
                    <video id="camVideo" class="layer" autoplay playsinline muted></video>
                    <canvas id="camCanvas" class="layer"></canvas>
                    <div id="filterFx"></div>
                    <img id="frameImg" src="" alt="Frame">
                    <div class="flash" id="flashFx"></div>
                    <div class="countdown" id="cdOverlay"><span id="cdNumber">3</span></div>
                </div>
            </div>
            <div class="btn-row">
                <button class="btn-capture" id="btnCapture" disabled><i class="fas fa-camera"></i>Capture</button>
                <button class="btn-retake" id="btnRetake" style="display:none"><i class="fas fa-redo"></i>Retake</button>
                <button class="btn-done" id="btnDone" style="display:none"><i class="fas fa-check"></i>Done</button>
                <button class="btn-retry" id="btnRetry" style="display:none"><i class="fas fa-sync-alt"></i>Retry</button>
                <button class="btn-queue" id="btnQueue" style="display:none"><i class="fas fa-list"></i>Queue</button>
            </div>
        </div>
    </div>
    <div class="controls">
        <div class="section-title">Filters</div>
        <div class="filter-scroll-container">
            <div class="scroll-row" id="filterRow"></div>
        </div>
        <div class="section-title">Frames</div>
        <div class="scroll-row" id="frameRow"></div>
    </div>
    <div id="fabWidget">
        <div class="photo-tools-card" id="sidebar">
            <div class="photo-tools-inner" id="sidebarContent">
                <div class="photo-tools-title"><i class="fas fa-sliders-h"></i> Pengaturan</div>
                <div class="photo-tools-divider"></div>

                <div class="camera-config-wrap">
                    <i class="fas fa-video"></i>
                    <select id="cameraSelect">
                        <option value="">Default Camera</option>
                    </select>
                    <i class="fas fa-chevron-down"></i>
                </div>

                <div class="timer-config-wrap">
                    <i class="fas fa-clock"></i>
                    <select class="timer-select" id="captureTimerSelect">
                        <option value="3">3s</option>
                        <option value="5" selected>5s</option>
                        <option value="10">10s</option>
                        <option value="30">30s</option>
                    </select>
                    <i class="fas fa-chevron-down"></i>
                </div>

                <div class="photo-tools-divider"></div>

                <div id="mirrorHBadgeWrap"></div>
                <div id="mirrorVBadgeWrap"></div>

                <div class="photo-tools-divider"></div>

                <div id="handDetectBadgeWrap"></div>

                <div class="photo-tools-divider"></div>

                <button class="btn-back" id="btnBack"><i class="fas fa-arrow-left"></i> Back</button>
            </div>
        </div>

        <button class="fab-btn" id="fabBtn" aria-label="Toggle settings">
            <i class="fas fa-sliders-h" id="fabIcon"></i>
        </button>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script type="module">
    import { Booth } from './assets/js/booth.js';
</script>
<?php include 'partials/modals/print-modal.php'; ?>
<?php include 'partials/modals/qr-modal.php'; ?>
<?php include 'partials/modals/email-modal.php'; ?>
<?php include 'partials/footer.php'; ?>
<script>
if ('serviceWorker' in navigator) {
    const SW_VERSION = '<?php echo AppConfig::getAppVersion(); ?>';

    // If stored version differs, force-clear all caches and reload
    const storedVersion = localStorage.getItem('kidversa_sw_version');
    if (storedVersion && storedVersion !== SW_VERSION) {
        console.log('[Kidversa] Version changed (' + storedVersion + ' -> ' + SW_VERSION + '), clearing caches...');
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
                console.log('SW registered:', reg.scope);
                // If a new SW is waiting, tell it to activate immediately
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated' && !window.__swReloadDone) {
                                window.__swReloadDone = true;
                                console.log('SW updated — reloading');
                                window.location.reload();
                            }
                        });
                    }
                });
            })
            .catch(err => console.error('SW registration failed:', err));

        // Listen for SW version update messages
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED' && !window.__swReloadDone) {
                window.__swReloadDone = true;
                console.log('SW updated to v' + event.data.version + ' — reloading');
                window.location.reload();
            }
        });
    });
}
</script>
<script>
(function() {
  document.addEventListener('click', function(e) {
    var el = e.target.closest('.mirror-badge, .hand-detect-badge, .btn-back, .camera-config-wrap, .timer-config-wrap');
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var ripple = document.createElement('span');
    var size = Math.max(rect.width, rect.height) * 1.4;
    ripple.className = 'ripple-el';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 600);
  });
})();
</script>
</body>
</html>
