import { Config } from './Config.js';
import { Lang } from './Lang.js';

export class ModalManager {
    constructor(booth) {
        this.booth = booth;
        this.printModal = document.getElementById('printModal');
        this.qrModal = document.getElementById('qrModal');
        this.emailModal = document.getElementById('emailModal');
    }

    init() {
        this.printModal?.addEventListener('click', (e) => {
            if (e.target === this.printModal) this.closeModal();
        });

        document.getElementById('btnDownload')?.addEventListener('click', () => this.downloadNow());
        document.getElementById('btnPrint')?.addEventListener('click', () => this.printNow());
        document.getElementById('btnEmailAction')?.addEventListener('click', () => this.openEmailModal());
        document.getElementById('btnQrAction')?.addEventListener('click', () => this.openQRModal());
        document.getElementById('btnHome')?.addEventListener('click', () => { window.location.href = 'index.php'; });
        document.getElementById('btnClosePrint')?.addEventListener('click', () => this.closeModal());
        document.getElementById('btnCloseQr')?.addEventListener('click', () => this.closeQRModal());
        document.getElementById('btnCloseEmail')?.addEventListener('click', () => this.closeEmailModal());
        document.getElementById('btnSendEmail')?.addEventListener('click', () => this.sendEmail());
    }

    closeModal() {
        this.printModal?.classList.remove('on');
        this.qrModal && (this.qrModal.style.display = 'none');
    }

    openEmailModal() {
        const statusCheck = this.checkPhotoStatusBeforeAction('Email');
        if (!statusCheck.allowed) {
            const btnEmail = document.querySelector('.btn-email');
            if (statusCheck.reason === 'pending') {
                if (btnEmail) this.setActionButtonPending(btnEmail);
            } else {
                if (btnEmail) this.setActionButtonError(btnEmail);
            }
            return;
        }
        this.emailModal && (this.emailModal.style.display = 'flex');
    }

    closeEmailModal() {
        this.emailModal && (this.emailModal.style.display = 'none');
    }

    async sendEmail() {
        const emailInput = document.getElementById('emailInput');
        const emailError = document.getElementById('emailError');
        const btnSend = document.getElementById('btnSendEmail');
        const email = emailInput.value.trim();

        const emailRegex = Config.email().regex;
        if (!emailRegex.test(email)) {
            emailError.style.display = 'block';
            emailInput.style.borderColor = 'red';
            return;
        }

        emailError.style.display = 'none';
        emailInput.style.borderColor = '';

        if (!this.booth || !this.booth.savedFilename) {
            alert(Lang.get('error.prefix') + 'Foto tidak tersedia. Silakan ambil foto terlebih dahulu.');
            return;
        }

        const originalBtnText = btnSend.innerHTML;
        btnSend.disabled = true;
        btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const res = await fetch('api/send-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: this.booth.savedFilename,
                    email: email,
                    csrf_token: this.booth.csrfToken
                })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const data = await res.json();

            if (data.success) {
                btnSend.innerHTML = '<i class="fas fa-check"></i> Success';
                btnSend.style.background = '#28a745';

                let countdown = Config.email().modal?.countdown ?? 10;
                const countdownEl = document.getElementById('emailCountdown');
                const timer = setInterval(() => {
                    if (countdown > 0) {
                        countdown--;
                        if (countdownEl) countdownEl.textContent = `Closing in ${countdown}s`;
                    } else {
                        clearInterval(timer);
                        if (countdownEl) countdownEl.textContent = '';
                        this.closeEmailModal();
                        btnSend.disabled = false;
                        btnSend.innerHTML = originalBtnText;
                        btnSend.style.background = '';
                        emailInput.value = '';
                    }
                }, 1000);
            } else {
                throw new Error(data.message || 'Failed to send email');
            }
        } catch (e) {
            console.error('[ModalManager] sendEmail Error:', e);
            alert(Lang.get('error.prefix') + (e.message || 'Failed to send email'));
            btnSend.disabled = false;
            btnSend.innerHTML = `<i class="fas fa-redo"></i> ${Lang.get('email.retry')}`;
            btnSend.style.background = '#dc3545';
            setTimeout(() => {
                btnSend.innerHTML = originalBtnText;
                btnSend.style.background = '';
            }, 3000);
        }
    }

    setActionButtonError(button, message = 'Foto Tidak tersedia') {
        const originalText = button.innerHTML;
        const originalBg = button.style.background;
        button.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        button.style.background = '#EF4444';
        button.disabled = true;
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = originalBg;
            button.disabled = false;
        }, 3000);
    }

    setActionButtonPending(button, message = 'Foto Masih Di Proses') {
        const originalText = button.innerHTML;
        const originalBg = button.style.background;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        button.style.background = '#F59E0B';
        button.disabled = true;
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = originalBg;
            button.disabled = false;
        }, 3000);
    }

    checkPhotoStatusBeforeAction(actionName = 'aksi') {
        if (!this.booth) {
            return { allowed: false, reason: 'boothNotReady' };
        }
        const photoStatus = this.booth.getPhotoStatus();
        if (photoStatus.status === 'pending') {
            return { allowed: false, reason: 'pending', key: photoStatus.key };
        }
        if (photoStatus.status === 'none' || !photoStatus.filename) {
            return { allowed: false, reason: 'notAvailable' };
        }
        return { allowed: true, filename: photoStatus.filename };
    }

    async downloadNow() {
        const statusCheck = this.checkPhotoStatusBeforeAction('Download');
        if (!statusCheck.allowed) {
            const btnDownload = document.querySelector('.btn-download');
            if (statusCheck.reason === 'pending') {
                if (btnDownload) this.setActionButtonPending(btnDownload);
            } else {
                if (btnDownload) this.setActionButtonError(btnDownload);
            }
            return;
        }

        try {
            const photoUrl = 'uploads/photos/' + statusCheck.filename;
            const link = document.createElement('a');
            link.href = photoUrl;
            link.download = 'kidversa-photo-' + Date.now() + '.png';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('[ModalManager] Download error:', e);
            alert(Lang.get('error.prefix') + 'Gagal mengunduh foto');
        }
    }

    async printNow() {
        const statusCheck = this.checkPhotoStatusBeforeAction('Print');
        if (!statusCheck.allowed) {
            const btnPrint = document.querySelector('.btn-print');
            if (statusCheck.reason === 'pending') {
                if (btnPrint) this.setActionButtonPending(btnPrint);
            } else {
                if (btnPrint) this.setActionButtonError(btnPrint);
            }
            return;
        }

        try {
            const photoUrl = 'uploads/photos/' + statusCheck.filename;
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (e) => reject(e);
                img.src = photoUrl;
            });

            const printCanvas = document.createElement('canvas');
            printCanvas.width = img.width || this.booth.cameraConfig.TW;
            printCanvas.height = img.height || this.booth.cameraConfig.TH;
            const ctx = printCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, printCanvas.width, printCanvas.height);

            const blobUrl = printCanvas.toDataURL('image/png');
            const blob = await this.booth.dataURLtoBlob(blobUrl);
            const objectUrl = URL.createObjectURL(blob);

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:100%;height:100%;';
            document.body.appendChild(iframe);

            let printFired = false;
            const doPrint = () => {
                if (printFired) return;
                printFired = true;
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) {
                    console.error('[ModalManager] Print failed:', e);
                }
            };

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`<!DOCTYPE html><html>
<head><title>Print Photo</title>
<style>
    * { margin: 0; padding: 0; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
    img { max-width: 100%; height: auto; }
    @page { margin: 0; size: auto; }
    @media print { body { margin: 0; padding: 0; } }
</style>
</head>
<body>
    <img src="${objectUrl}" onload="setTimeout(() => { window.parent.triggerPrint && window.parent.triggerPrint(); }, 200);">
</body>
</html>`);
            iframeDoc.close();

            window.triggerPrint = doPrint;
            setTimeout(doPrint, 800);
            setTimeout(() => {
                try {
                    delete window.triggerPrint;
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(objectUrl);
                } catch (e) {}
            }, 15000);
        } catch (e) {
            console.error('[ModalManager] Print error:', e);
            alert(Lang.get('error.prefix') + 'Gagal menyiapkan foto untuk dicetak');
        }
    }

    closeQRModal() {
        this.qrModal && (this.qrModal.style.display = 'none');
    }

    async openQRModal() {
        if (!this.booth || !this.booth.ui) return;

        const statusCheck = this.checkPhotoStatusBeforeAction('QR');
        if (!statusCheck.allowed) {
            const btnQr = document.querySelector('.btn-qr');
            if (statusCheck.reason === 'pending') {
                if (btnQr) this.setActionButtonPending(btnQr);
            } else {
                if (btnQr) this.setActionButtonError(btnQr);
            }
            return;
        }

        this.booth.ui.showQRModal();
        this.booth.ui.setQRLoading(true);

        try {
            const baseUrl = window.location.protocol + '//' + window.location.host;
            const qrUrl = `${baseUrl}/api/generate-qr.php?filename=${encodeURIComponent(statusCheck.filename)}`;

            const qrImage = document.getElementById('qrImage');
            qrImage.onload = () => this.booth.ui.setQRLoading(false);
            qrImage.onerror = () => {
                console.error('[ModalManager] Failed to load QR image');
                alert('Failed to generate QR code');
                this.booth.ui.hideQRModal();
            };
            this.booth.ui.setQRImage(qrUrl);
        } catch (e) {
            console.error('[ModalManager] QR Modal Error:', e);
            this.booth.ui.showToastMessage('Error: ' + e.message);
            alert(Lang.get('error.prefix') + e.message);
            this.booth.ui.hideQRModal();
        }
    }
}
