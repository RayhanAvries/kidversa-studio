<div class="modal-bg" id="qrModal" style="display:none;">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-qrcode"></i></div>
        <div class="modal-title">Scan to Download</div>
        <div class="modal-sub">Scan the QR code below to download your photo</div>
        
        <div class="qr-container" style="margin: 20px 0; display: flex; justify-content: center; align-items: center; min-height: 200px; background: #F8FAFC; border-radius: 12px;">
            <div id="qrLoading" style="text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #8B5CF6;"></i>
                <div style="font-size: 12px; color: #64748B; margin-top: 8px;">Generating QR...</div>
            </div>
            <img id="qrImage" src="" alt="QR Code" style="display:none; max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        </div>

        <div class="modal-actions">
            <button class="btn-close" id="btnCloseQr">Close</button>
        </div>
    </div>
</div>