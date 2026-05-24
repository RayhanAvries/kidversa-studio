<?php
require_once __DIR__ . '/../src/Config/AppConfig.php';
use Kidversa\Config\AppConfig;

$pageTitle = "Capture - Kidversa Studio";
$pageCss = ["assets/css/capture.css"];
include 'partials/header.php';
?>

<div class="app">
    <div class="top-bar">
        <div class="brand"><i class="fas fa-star" style="color:#EAB308;font-size:0.7rem"></i>Kidversa <span>Studio</span></div>
        <div class="top-actions">
            <div class="timer-wrap"><span class="timer" id="timer">01:30</span></div>
            <button class="btn-back" onclick="location.href='<?php echo AppConfig::getBaseUrl(); ?>/index.php'"><i class="fas fa-arrow-left"></i>Back</button>
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
<div class="modal-bg" id="printModal">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-check-circle"></i></div>
        <div class="modal-title">Photo Ready!</div>
        <div class="modal-sub">Your photo is ready to print</div>
        <div class="modal-actions">
            <button class="btn-modal btn-print" onclick="printNow()"><i class="fas fa-print"></i>Print Photo</button>
            <button class="btn-modal btn-email" onclick="openEmailModal()"><i class="fas fa-envelope"></i>Send Email</button>
            <button class="btn-modal btn-qr" onclick="openQRModal()"><i class="fas fa-qrcode"></i> Download Via QR</button>
            <button class="btn-modal btn-home" onclick="location.href='<?php echo AppConfig::getBaseUrl(); ?>/index.php'"><i class="fas fa-home"></i>Back to Home</button>
            <button class="btn-close" onclick="closeModal()">Cancel</button>
        </div>
    </div>
</div>

<div class="modal-bg" id="qrModal" style="display:none; z-index: 2000;">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-qrcode"></i></div>
        <div class="modal-title">Scan to Download</div>
        <div class="modal-sub">Scan the QR code below to download your photo</div>
        
        <div class="qr-container" style="margin: 20px 0; display: flex; justify-content: center; align-items: center; min-height: 200px; background: #f9f9f9; border-radius: 12px; padding: 20px; border: 2px dashed #ddd;">
            <div id="qrLoading" style="text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #666;"></i>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Generating QR Code...</div>
            </div>
            <img id="qrImage" src="" alt="QR Code" style="display:none; max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        </div>

        <div class="modal-actions">
            <button class="btn-close" onclick="closeQRModal()">Close</button>
        </div>
    </div>
</div>

<div class="modal-bg" id="emailModal" style="display:none; z-index: 2000;">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-paper-plane"></i></div>
        <div class="modal-title">Send via Email</div>
        <div class="modal-sub">Enter your Gmail address to receive the photo</div>
        
        <div class="modal-form" style="margin: 20px 0; text-align: left;">
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 5px; margin-left: 5px;">Email Address</label>
                <input type="email" id="emailInput" placeholder="example@gmail.com"
                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                <div id="emailError" style="color: #ef4444; font-size: 11px; margin-top: 5px; margin-left: 5px; display: none;">
                    Please enter a valid @gmail.com address
                </div>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-modal btn-send" id="btnSendEmail" onclick="sendEmail()"><i class="fas fa-paper-plane"></i>Send Now</button>
            <button class="btn-close" onclick="closeEmailModal()">Cancel</button>
        </div>
    </div>
</div>

<script type="module" src="<?php echo AppConfig::getBaseUrl(); ?>/assets/js/booth.js"></script>
<?php include 'partials/footer.php'; ?>