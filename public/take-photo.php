<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Capture - Kidversa Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/capture.css">
</head>
<body>
<div class="app">
    <div class="top-bar">
        <div class="brand"><i class="fas fa-star" style="color:#EAB308;"></i>Kidversa <span>Studio</span></div>
        <div class="top-actions">
            <div class="timer-config-wrap">
                <i class="fas fa-clock"></i>
                <select class="timer-select" id="captureTimerSelect">
                    <option value="3">3s</option>
                    <option value="5" selected>5s</option>
                    <option value="10">10s</option>
                    <option value="30">30s</option>
                </select>
            </div>
            <div id="handDetectBadgeWrap"></div>
            <button class="btn-back" id="btnBack"><i class="fas fa-arrow-left"></i>Back</button>
        </div>
    </div>
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
        </div>
    </div>
    <div class="controls">
        <div class="section-title">Filters</div>
        <div class="filter-scroll-container">
            <div class="scroll-row" id="filterRow"></div>
        </div>
        <div class="section-title" style="margin-top:5px">Frames</div>
        <div class="scroll-row" id="frameRow"></div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
<script type="module">
    import { Booth } from './assets/js/booth.js';
</script>
<?php include 'partials/modals/print-modal.php'; ?>
<?php include 'partials/modals/qr-modal.php'; ?>
<?php include 'partials/modals/email-modal.php'; ?>
<?php include 'partials/footer.php'; ?>
</body>
</html>