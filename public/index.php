<?php
require_once __DIR__ . '/../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

$pageTitle = "Kidversa Studio";
$pageCss = ["assets/css/main.css"];
include 'partials/header.php';
?>

    <div class="dot-pattern"></div>
    <div class="blob blob-purple"></div>
    <div class="blob blob-yellow"></div>
    <div class="blob blob-purple-sm"></div>

    <div class="scene">
        <div class="logo-stage">
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-ring"><span class="logo-dot"></span></div>
            <div class="logo-core">
                <img src="<?php echo AppConfig::getBaseUrl(); ?>/assets/img/logo.png"
                     alt="Kidversa Studio Logo" 
                     class="logo-img"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo-fallback">
                    <i class="fas fa-star"></i>
                </div>
            </div>
        </div>

        <div class="brand-block">
            <h1 class="brand-title">Kidversa <span class="accent">Studio</span></h1>
            <p class="brand-sub">Creative Visuals</p>
        </div>

        <a href="take-photo.php" class="btn-trigger" id="startButton">
            Start Capture
        </a>
    </div>

    <script src="assets/js/main.js"></script>
<?php include 'partials/footer.php'; ?>