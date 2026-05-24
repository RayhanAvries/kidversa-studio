export class BoothUI {
    constructor() {
        this.btnCap = document.getElementById('btnCapture');
        this.btnRet = document.getElementById('btnRetake');
        this.btnDone = document.getElementById('btnDone');
        this.timerEl = document.getElementById('timer');
        this.toastWarn = document.getElementById('toastWarn');
        this.modal = document.getElementById('printModal');
        this.qrModal = document.getElementById('qrModal');
        this.cdOverlay = document.getElementById('cdOverlay');
        this.cdNumber = document.getElementById('cdNumber');
        this.flashFx = document.getElementById('flashFx');
        this.mainArea = document.getElementById('mainArea');
    }

    updateTimer(timeLeft) {
        const m = Math.floor(Math.max(0, timeLeft) / 60);
        const s = Math.max(0, timeLeft) % 60;
        this.timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 10 && timeLeft > 0) {
            this.timerEl.classList.add('warn');
        }
    }

    setCaptureButtonState(disabled) {
        this.btnCap.disabled = disabled;
    }

    setCaptureButtonText(text, icon) {
        this.btnCap.innerHTML = text;
    }

    showToast() {
        this.toastWarn.classList.add('show');
        setTimeout(() => this.toastWarn.classList.remove('show'), 3000);
    }

    startCountdownUI(number) {
        this.cdOverlay.classList.add('on');
        this.cdNumber.textContent = number;
    }

    updateCountdownUI(number) {
        this.cdNumber.textContent = number;
        this.cdNumber.style.animation = 'none';
        this.cdNumber.offsetHeight;
        this.cdNumber.style.animation = 'pop 0.7s cubic-bezier(0.68,-0.55,0.265,1.55)';
    }

    stopCountdownUI() {
        this.cdOverlay.classList.remove('on');
    }

    triggerFlash() {
        this.flashFx.classList.add('on');
        setTimeout(() => this.flashFx.classList.remove('on'), 80);
    }

    showPrintModal() {
        this.modal.classList.add('on');
    }

    showQRModal() {
        this.qrModal.style.display = 'flex';
    }

    hideQRModal() {
        this.qrModal.style.display = 'none';
    }

    setQRLoading(isLoading) {
        const loading = document.getElementById('qrLoading');
        const image = document.getElementById('qrImage');
        if (isLoading) {
            loading.style.display = 'block';
            image.style.display = 'none';
        } else {
            loading.style.display = 'none';
            image.style.display = 'block';
        }
    }

    setQRImage(src) {
        const image = document.getElementById('qrImage');
        image.src = src;
    }

    showEmailModal() {
        const emailModal = document.getElementById('emailModal');
        if (emailModal) emailModal.style.display = 'flex';
    }

    hideEmailModal() {
        const emailModal = document.getElementById('emailModal');
        if (emailModal) emailModal.style.display = 'none';
    }

    setCaptureControls(state) {
        if (state === 'capture') {
            this.btnCap.style.display = 'flex';
            this.btnRet.style.display = 'none';
            this.btnDone.style.display = 'none';
        } else if (state === 'captured') {
            this.btnCap.style.display = 'none';
            this.btnRet.style.display = 'flex';
            this.btnDone.style.display = 'flex';
        } else if (state === 'done') {
            this.btnCap.style.display = 'none';
            this.btnRet.style.display = 'none';
            this.btnDone.style.display = 'flex';
        }
    }

    scrollToTop() {
        this.mainArea.scrollTop = 0;
    }
}