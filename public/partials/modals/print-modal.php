<div class="modal-bg" id="printModal">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-check-circle"></i></div>
        <div class="modal-title">Photo Ready!</div>
        <div class="modal-sub">Your photo is ready</div>
        <div class="modal-actions">
            <button class="btn-modal btn-download" onclick="downloadNow()"><i class="fas fa-download"></i>Download Photo</button>
            <button class="btn-modal btn-print" onclick="printNow()"><i class="fas fa-print"></i>Print Photo</button>
            <button class="btn-modal btn-email" onclick="openEmailModal()"><i class="fas fa-envelope"></i>Send Email</button>
            <button class="btn-modal btn-qr" onclick="openQRModal()"><i class="fas fa-qrcode"></i> Download Via QR</button>
            <button class="btn-modal btn-home" onclick="location.href='index.php'"><i class="fas fa-home"></i>Back to Home</button>
            <button class="btn-close" onclick="closeModal()">Cancel</button>
        </div>
    </div>
</div>