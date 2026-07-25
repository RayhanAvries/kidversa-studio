<div class="modal-bg" id="emailModal" style="display:none; z-index: 2000;">
    <div class="modal-box">
        <div class="modal-icon"><i class="fas fa-paper-plane"></i></div>
        <div class="modal-title">Send via Email</div>
        <div class="modal-sub">Enter your Gmail address to receive the photo</div>
        
        <div class="modal-form" style="margin: 20px 0; text-align: left;">
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; font-size: 12px; color: #374151; margin-bottom: 5px;">Email Address</label>
                <input type="email" id="emailInput" placeholder="example@gmail.com"
                       style="width: 100%; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; font-family: inherit;">
                <div id="emailError" style="color: #EF4444; font-size: 12px; margin-top: 5px; display: none;">
                    Please enter a valid @gmail.com address
                </div>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-modal btn-send" id="btnSendEmail"><i class="fas fa-paper-plane"></i>Send Now</button>
            <button class="btn-close" id="btnCloseEmail">Cancel</button>
        </div>
        <div id="emailCountdown" style="font-size:12px; text-align:center; margin-top:4px; color:#64748B;"></div>
    </div>
</div>