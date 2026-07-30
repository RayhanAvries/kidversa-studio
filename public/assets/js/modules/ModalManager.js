import { Config } from './Config.js';
import { Lang } from './Lang.js';
import { BlobDownloader } from './BlobDownloader.js';
import { SharedActions } from './SharedActions.js';

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

        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) btnDownload.style.display = '';

        const btnHome = document.getElementById('btnHome');
        if (btnHome) btnHome.style.display = '';
    }

    openForGalleryPhoto(filename) {
        if (!this.booth) return;
        this.booth.savedFilename = filename;
        this.booth.pendingUpload = null;
        this.booth.uploadKey = null;

        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) btnDownload.style.display = 'none';

        const btnHome = document.getElementById('btnHome');
        if (btnHome) btnHome.style.display = 'none';

        this.printModal?.classList.add('on');
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
        const currentFilename = this.booth?.savedFilename;
        const token = this.booth?.csrfToken;
        if (!currentFilename || !token) return { success: false, error: 'missing context' };

        const result = await SharedActions.sendEmail(currentFilename, token);

        if (result.success) {
            setTimeout(() => this.closeEmailModal(), 1500);
        } else if (result.error !== 'validation' && this.booth?.operationQueue) {
            await this.booth.operationQueue.enqueue({
                type: 'email',
                filename: currentFilename,
                email: document.getElementById('emailInput')?.value?.trim() || '',
            });
        }

        return result;
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

        const btnDownload = document.querySelector('.btn-download');
        const originalText = btnDownload?.innerHTML;
        if (btnDownload) {
            btnDownload.disabled = true;
            btnDownload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        }

        try {
            const photoUrl = 'uploads/photos/' + statusCheck.filename;
            await BlobDownloader.downloadWithRetry(
                photoUrl,
                'kidversa-photo-' + Date.now() + '.jpg',
                (progress) => {
                    if (btnDownload) {
                        btnDownload.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progress.percent}%`;
                    }
                },
                3
            );

            if (btnDownload) {
                btnDownload.innerHTML = '<i class="fas fa-check"></i> Done';
                setTimeout(() => {
                    btnDownload.disabled = false;
                    btnDownload.innerHTML = originalText;
                }, 2000);
            }
        } catch (e) {
            console.error('[ModalManager] Download error:', e);
            if (btnDownload) {
                btnDownload.disabled = false;
                btnDownload.innerHTML = `<i class="fas fa-redo"></i> Retry`;
                setTimeout(() => {
                    btnDownload.innerHTML = originalText;
                }, 3000);
            }
            alert(Lang.get('error.prefix') + 'Gagal mengunduh foto. Silakan coba lagi.');
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

        await SharedActions.printPhoto('uploads/photos/' + statusCheck.filename);
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
            const viewUrl = `${baseUrl}/view-photo.php?file=${encodeURIComponent(statusCheck.filename)}`;

            await SharedActions.generateQR(viewUrl, 'qrImage');
        } catch (e) {
            console.error('[ModalManager] QR Modal Error:', e);
            this.booth.ui.showToastMessage('Error: ' + e.message);
            alert(Lang.get('error.prefix') + e.message);
            this.booth.ui.hideQRModal();
        } finally {
            this.booth.ui.setQRLoading(false);
        }
    }
}
