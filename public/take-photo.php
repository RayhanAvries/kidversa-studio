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
            <div class="timer-wrap"><span class="timer" id="timer">01:30</span></div>
            <button class="btn-back" onclick="location.href='index.php'"><i class="fas fa-arrow-left"></i>Back</button>
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
                <div class="toast warn" id="toastWarn"><i class="fas fa-exclamation-triangle"></i> Time's up! Last capture</div>
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
        <div class="scroll-row" id="filterRow"></div>
        <div class="section-title" style="margin-top:5px">Frames</div>
        <div class="scroll-row" id="frameRow"></div>
    </div>
</div>
<script type="module">
    import { Booth } from './assets/js/booth.js';
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.app) {
            window.app = new Booth();
        }
    });
</script>
<?php include 'partials/modals/print-modal.php'; ?>
<?php include 'partials/modals/qr-modal.php'; ?>
<?php include 'partials/modals/email-modal.php'; ?>
<?php include 'partials/footer.php'; ?>
</body>
</html>