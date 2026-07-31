<?php
require_once __DIR__ . '/../src/bootstrap.php';
use Kidversa\Config\AppConfig;
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Kidversa Studio — Welcome</title>
    <link rel="icon" href="favicon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="assets/css/main.css?v=<?php echo AppConfig::getAppVersion(); ?>">
</head>

<body>

    <div class="bg-gradient"></div>
    <div class="stars" id="stars"></div>
    <div class="dot-pattern"></div>
    <div class="blob blob-purple" data-speed="20"></div>
    <div class="blob blob-yellow" data-speed="-15"></div>
    <div class="blob blob-purple-sm" data-speed="30"></div>

    <div class="scene" id="scene">
        <div class="logo-stage">
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-core">
                <img src="assets/img/logo.png" alt="Kidversa Studio Logo" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo-fallback"><i class="fas fa-star"></i></div>
            </div>
        </div>

        <div class="brand-block">
            <h1 class="brand-title">Kidversa <span class="accent">Studio</span></h1>
            <p class="brand-sub">Creative Visuals</p>
        </div>

        <a href="take-photo.php" class="btn-trigger" id="startButton">
            <span>Start Capture</span>
            <i class="fas fa-arrow-right-long"></i>
        </a>
    </div>

    <script>
        (function () {
            var starsContainer = document.getElementById('stars');
            var starCount = 80;
            for (var i = 0; i < starCount; i++) {
                var star = document.createElement('div');
                star.className = 'star';
                star.style.top = Math.random() * 100 + '%';
                star.style.left = Math.random() * 100 + '%';
                star.style.animationDelay = (Math.random() * 4) + 's';
                star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px';
                starsContainer.appendChild(star);
            }
        })();

        (function () {
            var scene = document.getElementById('scene');
            var blobs = document.querySelectorAll('.blob');

            document.addEventListener('mousemove', function (e) {
                var x = (e.clientX / window.innerWidth) - 0.5;
                var y = (e.clientY / window.innerHeight) - 0.5;

                scene.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';

                blobs.forEach(function (blob) {
                    var speed = parseFloat(blob.dataset.speed);
                    blob.style.transform = 'translate(' + (x * speed) + 'px, ' + (y * speed) + 'px)';
                });
            });

            document.addEventListener('mouseleave', function () {
                scene.style.transform = 'rotateY(0deg) rotateX(0deg)';
            });
        })();

        (function () {
            var startButton = document.getElementById('startButton');
            startButton.addEventListener('click', function (e) {
                e.preventDefault();

                var rect = this.getBoundingClientRect();
                var ripple = document.createElement('span');
                var size = Math.max(rect.width, rect.height);
                ripple.className = 'ripple';
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                this.appendChild(ripple);

                setTimeout(function () {
                    window.location.href = 'take-photo.php';
                }, 350);

                setTimeout(function () {
                    ripple.remove();
                }, 600);
            });
        })();
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
