import { CameraManager } from './modules/CameraManager.js';
import { FilterEngine } from './modules/FilterEngine.js';
import { FrameManager } from './modules/FrameManager.js';
import { BoothUI } from './modules/BoothUI.js';
import { Config } from './modules/Config.js';
import { Lang } from './modules/Lang.js';
import { initPermissions } from './modules/InitPermissions.js';
import { HandDetection } from './modules/HandDetection.js';
import { HandDetectionUI } from './modules/HandDetectionUI.js';

export class Booth {
    constructor() {
        this.cameraConfig = {
            TW: Config.get('photo.width', 1920),
            TH: Config.get('photo.height', 1080),
            FALLBACK_TW: Config.get('photo.fallbackWidth', 1280),
            FALLBACK_TH: Config.get('photo.fallbackHeight', 720)
        };

        this.ui = new BoothUI();
        this.camera = new CameraManager(this.cameraConfig);
        this.frames = new FrameManager();
        this.filters = null;

        this.selFilter = 'none';
        this.captured = null;
        this.savedFilename = null;
        this.pendingUpload = null;
        this.uploadKey = null;

        this.handDetect = null;
        this.handDetectUI = null;

        console.log('BoothUI instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.ui)));

        this.counting = false;

        this.init();
    }

    async init() {
      console.log('[Booth] init() method called');
      try {
        await Config.load();

        const filterRes = await fetch('assets/config/filters.json');
        if (!filterRes.ok) throw new Error(`Filters fetch failed: ${filterRes.status}`);
        const filterData = await filterRes.json();
        this.filters = new FilterEngine({ filters: filterData });

        await this.frames.loadFrameList();

        this.filters.buildFilterUI();
        this.frames.buildFrameUI();
        this.bindEvents();

        if (this.frames.frameFiles.length > 0) {
          this.frames.setFrame(this.frames.frameFiles[0]);
          this.frames.loadFrame();
        }

        window.__appPermissions = await initPermissions();

        await this.camera.start();

        this.ui.setCaptureButtonState(false);
        const f = this.filters.applyFilter(this.selFilter);
        document.getElementById('filterFx').style.display = f.overlay ? 'block' : 'none';

        if (this.camera.stream) {
            this.filters.initPreviews(this.camera.stream);
        }

        this._initHandDetection();
      } catch (e) {
        console.error('[Booth] FATAL ERROR during init():', e);
        this.ui.btnCap.onclick = () => window.location.reload();
      }
    }

    bindEvents() {
        document.getElementById('filterRow').addEventListener('click', e => {
            const c = e.target.closest('.filter-card');
            if (!c) return;
            document.querySelectorAll('.filter-card').forEach(el => el.classList.remove('sel'));
            c.classList.add('sel');
            this.selFilter = c.dataset.filter;
            this.filters.applyFilter(this.selFilter);
            if (this.captured) {
                this.handleFilterOrFrameChange();
            }
        });

        document.getElementById('frameRow').addEventListener('click', e => {
            const c = e.target.closest('.frame-card');
            if (!c) return;
            document.querySelectorAll('.frame-card').forEach(el => el.classList.remove('sel'));
            c.classList.add('sel');
            this.frames.setFrame(c.dataset.frame);
            if (this.captured) {
                this.handleFilterOrFrameChange();
            }
        });

        this.ui.btnCap.addEventListener('click', () => this.startCountdown());
        this.ui.btnRet.addEventListener('click', () => this.retake());
        this.ui.btnDone.addEventListener('click', () => this.finish());

        document.addEventListener('touchmove', e => {
            if (!e.target.closest('.scroll-row') && !e.target.closest('.filter-scroll-container') && !e.target.closest('.controls')) e.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturestart', e => e.preventDefault());

        window.addEventListener('resize', () => {
            if (this.camera.ready) this.camera.updateCanvas();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.camera.ready) this.camera.updateCanvas();
            }, 300);
        });

        window.addEventListener('keydown', e => {
            if ((e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) && this.captured) {
                e.preventDefault();
                if (this.confirmNavigation()) {
                    window.location.reload();
                }
            }
        });

        const btnBack = document.getElementById('btnBack');
        if (btnBack) {
            btnBack.addEventListener('click', e => {
                e.preventDefault();
                if (this.confirmNavigation()) {
                    window.location.href = 'index.php';
                }
            });
        }
    }

    confirmNavigation() {
        if (!this.captured) return true;
        const first = confirm("Apakah Anda yakin ingin meninggalkan halaman ini? Foto Anda akan hilang.");
        if (!first) return false;
        const second = confirm("Konfirmasi Kedua: Apakah Anda benar-benar yakin ingin kembali dan menghapus foto Anda?");
        return second;
    }

    async handleFilterOrFrameChange() {
        if (!this.rawData) return;
        this.showCaptured();
        await this.savePhotoToBackend(true);
    }

    startCountdown() {
        if (!this.camera.ready || this.counting) return;
        this.counting = true;
        this.ui.setCaptureButtonState(true);
        const timerSelect = document.getElementById('captureTimerSelect');
        let c = timerSelect ? parseInt(timerSelect.value, 10) : 5;
        this.ui.startCountdownUI(c);

        const iv = setInterval(() => {
            c--;
            if (c > 0) {
                this.ui.updateCountdownUI(c);
            } else {
                clearInterval(iv);
                this.ui.stopCountdownUI();
                this.ui.triggerFlash();
                this.capture();
                this.counting = false;
                this.ui.setCaptureButtonState(false);
            }
        }, 1000);
    }

    async capture() {
        if (this.handDetect && this.handDetect.isEnabled()) {
            this.handDetect.pause();
        }
        this.filters.stopPreviews();
        this.camera.stop();
        const rawData = this.camera.getCanvasData();
        this.rawData = rawData;
        const compositeCanvas = await this.composeFinalImage(rawData, this.cameraConfig.TW, this.cameraConfig.TH);
        this.captured = compositeCanvas.toDataURL('image/png');
        this.showCaptured();
        document.getElementById('camVideo').style.display = 'none';
        document.getElementById('camCanvas').style.display = 'block';
        this.ui.setCaptureControls('captured');
        this.ui.scrollToTop();
        await this.savePhotoToBackend();
    }

    async composeFinalImage(imageDataUrl, targetWidth, targetHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth || this.camera.cnv.width;
                    canvas.height = targetHeight || this.camera.cnv.height;
                    const ctx = canvas.getContext('2d');
                    
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const filterObj = this.filters.applyFilter(this.selFilter);
                    
                    ctx.save();
                    ctx.filter = filterObj.filter || 'none';
                    
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    
                    const imgRatio = imgWidth / imgHeight;
                    const canvasRatio = canvasWidth / canvasHeight;
                    
                    let drawWidth, drawHeight, offsetX, offsetY;
                    
                    if (imgRatio > canvasRatio) {
                        drawHeight = imgHeight;
                        drawWidth = imgHeight * canvasRatio;
                        offsetX = (imgWidth - drawWidth) / 2;
                        offsetY = 0;
                    } else {
                        drawWidth = imgWidth;
                        drawHeight = imgWidth / canvasRatio;
                        offsetX = 0;
                        offsetY = (imgHeight - drawHeight) / 2;
                    }
                    
                    ctx.drawImage(
                        img,
                        offsetX, offsetY, drawWidth, drawHeight,
                        0, 0, canvasWidth, canvasHeight
                    );
                    
                    ctx.restore();
                    
                    if (filterObj.overlay) {
                        ctx.fillStyle = filterObj.overlay;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    if (this.frames.selFrame && this.frames.selFrame !== '') {
                        const frameLoadResult = await this.loadFrameImage(this.frames.selFrame);
                        if (frameLoadResult) {
                            ctx.drawImage(frameLoadResult, 0, 0, canvas.width, canvas.height);
                        }
                    }
                    
                    resolve(canvas);
                } catch (e) {
                    console.error('[Booth] Error composing final image:', e);
                    const fallbackCanvas = document.createElement('canvas');
                    fallbackCanvas.width = targetWidth || 1920;
                    fallbackCanvas.height = targetHeight || 1080;
                    const fallbackCtx = fallbackCanvas.getContext('2d');
                    fallbackCtx.fillStyle = '#000000';
                    fallbackCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
                    const fallbackImg = new Image();
                    fallbackImg.onload = () => {
                        fallbackCtx.drawImage(fallbackImg, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
                        resolve(fallbackCanvas);
                    };
                    fallbackImg.onerror = () => resolve(fallbackCanvas);
                    fallbackImg.src = imageDataUrl;
                }
            };
            img.onerror = () => {
                console.error('[Booth] Failed to load image data for composition');
                const errorCanvas = document.createElement('canvas');
                errorCanvas.width = targetWidth || 1920;
                errorCanvas.height = targetHeight || 1080;
                const errorCtx = errorCanvas.getContext('2d');
                errorCtx.fillStyle = '#000000';
                errorCtx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
                resolve(errorCanvas);
            };
            img.src = imageDataUrl;
        });
    }

    async loadFrameImage(frameName) {
        return new Promise((resolve) => {
            const framePath = this.frames.getFramePath();
            const frameImg = new Image();
            frameImg.crossOrigin = 'anonymous';
            frameImg.onload = () => resolve(frameImg);
            frameImg.onerror = () => {
                console.warn('[Booth] Failed to load frame:', frameName);
                resolve(null);
            };
            frameImg.src = `${framePath}/${frameName}.png`;
        });
    }

    async savePhotoToBackend(isReplacement = false) {
        this.ui.showLoadingOverlay("Memproses...");
        let percent = 0;
        const messages = isReplacement ? [
            "Mempersiapkan data gambar...",
            "Memproses filter dan frame baru...",
            "Menghapus berkas foto lama di server...",
            "Mengunggah hasil komposisi baru...",
            "Mengompresi format file...",
            "Menyimpan foto dengan aman...",
            "Hampir selesai..."
        ] : [
            "Mempersiapkan data gambar...",
            "Mengompresi format file...",
            "Memproses filter dan frame...",
            "Menghubungkan ke server...",
            "Mengunggah berkas foto...",
            "Menyimpan foto dengan aman...",
            "Hampir selesai..."
        ];
        const progressInterval = setInterval(() => {
            if (percent < 90) {
                percent += Math.floor(Math.random() * 8) + 3;
                if (percent > 90) percent = 90;
                const step = Math.floor((percent / 100) * messages.length);
                const currentMsg = messages[Math.min(step, messages.length - 1)];
                this.ui.updateLoadingProgress(percent, currentMsg);
            }
        }, 150);
        try {
            if (isReplacement && this.savedFilename) {
                this.ui.updateLoadingProgress(percent, "Menghapus berkas foto lama di server...");
                const deleteFormData = new FormData();
                deleteFormData.append("filename", this.savedFilename);
                await fetch("api/delete-photo.php", {
                    method: "POST",
                    body: deleteFormData
                });
            }
            const compositeCanvas = await this.composeFinalImage(this.rawData, this.cameraConfig.TW, this.cameraConfig.TH);
            this.captured = compositeCanvas.toDataURL("image/png");
            const blob = await this.dataURLtoBlob(this.captured);
            const formData = new FormData();
            formData.append("image", blob, "capture.png");
            const location = window.__appPermissions?.position ? {
                lat: window.__appPermissions.position.coords.latitude,
                lng: window.__appPermissions.position.coords.longitude,
                name: window.__appPermissions.position.name || "Kidversa Studio, Bandung"
            } : { lat: -6.9175, lng: 107.6191, name: "Bandung" };
            formData.append("location_lat", location.lat);
            formData.append("location_lng", location.lng);
            formData.append("location_name", location.name);
            const uploadKey = "upload_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            this.uploadKey = uploadKey;
            this.pendingUpload = { key: uploadKey, startTime: Date.now() };
            const saveRes = await fetch("api/save-photo.php", {
                method: "POST",
                body: formData
            });
            const saveData = await saveRes.json();
            clearInterval(progressInterval);
            if (saveData.success) {
                this.savedFilename = saveData.filename;
                this.pendingUpload = null;
                this.ui.updateLoadingProgress(100, "Selesai!");
                setTimeout(() => {
                    this.ui.hideLoadingOverlay();
                }, 500);
            } else {
                throw new Error(saveData.message || "Gagal menyimpan foto");
            }
        } catch (e) {
            clearInterval(progressInterval);
            this.ui.hideLoadingOverlay();
            console.error(e);
            this.savedFilename = null;
            this.pendingUpload = null;
            alert("Error: " + e.message);
        }
    }

    getPhotoStatus() {
        if (this.pendingUpload && this.pendingUpload.key === this.uploadKey) {
            return { status: 'pending', key: this.uploadKey };
        }
        if (this.savedFilename) {
            return { status: 'saved', filename: this.savedFilename };
        }
        return { status: 'none' };
    }

    async retake() {
        this.rawData = null;
        this.captured = null;
        this.savedFilename = null;
        this.pendingUpload = null;
        this.uploadKey = null;
        this.ui.setCaptureControls('capture');
        this.ui.setCaptureButtonState(true);
        document.getElementById('camVideo').style.display = 'block';
        document.getElementById('camCanvas').style.display = 'none';
        this.camera.ctx.clearRect(0, 0, this.camera.cnv.width, this.camera.cnv.height);
        document.getElementById('camCanvas').style.filter = 'none';
        this.frames.loadFrame();
        const f = this.filters.applyFilter(this.selFilter);
        document.getElementById('filterFx').style.display = f.overlay ? 'block' : 'none';
        await this.camera.start();
        this.ui.setCaptureButtonState(false);
        if (this.camera.stream) {
            this.filters.initPreviews(this.camera.stream);
        }

        this._enableHandDetectionIfActive();
    }

    async dataURLtoBlob(dataurl) {
        try {
            const res = await fetch(dataurl);
            return await res.blob();
        } catch (e) {
            console.warn('[Booth] Fetch dataURL failed, falling back to atob', e);
            const arr = dataurl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        }
    }

    showCaptured() {
        const sourceImg = this.rawData || this.captured;
        if (!sourceImg) return;
        const img = new Image();
        img.onload = () => {
            this.camera.updateCanvas();
            const ctx = this.camera.ctx;
            ctx.clearRect(0, 0, this.camera.cnv.width, this.camera.cnv.height);
            const filterObj = this.filters.applyFilter(this.selFilter);
            ctx.filter = filterObj ? (filterObj.filter || 'none') : 'none';
            const imgWidth = img.width;
            const imgHeight = img.height;
            const canvasWidth = this.camera.cnv.width;
            const canvasHeight = this.camera.cnv.height;
            const imgRatio = imgWidth / imgHeight;
            const canvasRatio = canvasWidth / canvasHeight;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (imgRatio > canvasRatio) {
                drawHeight = imgHeight;
                drawWidth = imgHeight * canvasRatio;
                offsetX = (imgWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = imgWidth;
                drawHeight = imgWidth / canvasRatio;
                offsetX = 0;
                offsetY = (imgHeight - drawHeight) / 2;
            }
            ctx.drawImage(
                img,
                offsetX, offsetY, drawWidth, drawHeight,
                0, 0, canvasWidth, canvasHeight
            );
            ctx.filter = 'none';
            if (filterObj && filterObj.overlay) {
                ctx.fillStyle = filterObj.overlay;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
            document.getElementById('filterFx').style.display = 'none';
        };
        img.src = sourceImg;
        const filterObj = this.filters.applyFilter(this.selFilter);
        if (filterObj && filterObj.overlay) {
            document.getElementById('filterFx').style.background = filterObj.overlay;
            document.getElementById('filterFx').style.display = 'block';
        }
        this.frames.loadFrame();
    }

    async finish() {
        try {
            this.ui.showPrintModal();
        } catch (e) {
            console.error('[Booth] Finish error:', e);
            this.ui.showToastMessage('Error: ' + e.message);
            alert(Lang.get('error.prefix') + e.message);
        }
    }

    destroy() {
        if (this.handDetect) {
            this.handDetect.destroy();
            this.handDetect = null;
        }
        if (this.handDetectUI) {
            this.handDetectUI.destroy();
            this.handDetectUI = null;
        }
        this.filters.stopPreviews();
        this.camera.stop();
    }

    _initHandDetection() {
        const badgeWrap = document.getElementById('handDetectBadgeWrap');
        if (!badgeWrap) return;

        const photoBox = document.getElementById('photoBox');

        this.handDetectUI = new HandDetectionUI(badgeWrap, {
            onToggle: (active) => this._handleHandDetectToggle(active)
        });

        this.handDetect = new HandDetection({
            palmHoldTime: 1200,
            cooldownTime: 3500,
            onDetect: () => this._handleHandDetected(),
            onStatusChange: (status) => {
                if (status === 'loading') {
                    this.handDetectUI.setReady(false);
                } else if (status === 'ready') {
                    this.handDetectUI.setReady(true);
                }
            },
            onHandStateChange: (detected) => {
                this.handDetectUI.setHandDetected(detected);
                if (photoBox) {
                    if (detected) {
                        photoBox.classList.add('hand-detected');
                    } else {
                        photoBox.classList.remove('hand-detected');
                    }
                }
            }
        });

        this.handDetect.init(document.getElementById('camVideo')).then(ok => {
            this.handDetectUI.setReady(ok);
        });
    }

    _handleHandDetectToggle(active) {
        if (!this.handDetect) return;
        const photoBox = document.getElementById('photoBox');
        if (active) {
            if (!this.handDetect._modelLoaded) {
                this.handDetectUI.setLoading(true);
            }
            this.handDetect.start();
        } else {
            this.handDetect.enabled = false;
            this.handDetect.stop();
            if (photoBox) photoBox.classList.remove('hand-detected');
        }
    }

    _handleHandDetected() {
        if (!this.camera.ready || this.counting || this.captured) return;
        this.startCountdown();
    }

    _enableHandDetectionIfActive() {
        if (this.handDetect && this.handDetect.isEnabled()) {
            this.handDetect.start();
        }
    }
}

window.booth = new Booth();

window.addEventListener('beforeunload', e => {
    if (window.booth && window.booth.captured) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
    if (window.booth) window.booth.destroy();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (window.booth) {
            window.booth.filters.stopPreviews();
        }
    } else {
        if (window.booth && !window.booth.captured && window.booth.camera.ready) {
            window.booth.camera.startDraw();
            window.booth.filters.initPreviews(window.booth.camera.stream);
        }
    }
});

window.closeModal = () => {
    document.getElementById('printModal').classList.remove('on');

    if (window.booth && window.booth.ui && window.booth.ui.qrModal) {
        window.booth.ui.hideQRModal();
    }
};

window.openEmailModal = async () => {
    const statusCheck = window.checkPhotoStatusBeforeAction('Email');
    if (!statusCheck.allowed) {
        const btnEmail = document.querySelector('.btn-email');
        if (statusCheck.reason === 'pending') {
            if (btnEmail) window.setActionButtonPending(btnEmail);
        } else {
            if (btnEmail) window.setActionButtonError(btnEmail);
        }
        return;
    }

    window.booth.ui.showEmailModal();
};

window.closeEmailModal = () => {
    window.booth.ui.hideEmailModal();
};

window.sendEmail = async () => {
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

    const booth = window.booth;
    if (!booth || !booth.savedFilename) {
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
                filename: booth.savedFilename,
                email: email
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
                    window.closeEmailModal();
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
        console.error('[Booth] sendEmail Error:', e);
        alert(Lang.get('error.prefix') + (e.message || 'Failed to send email'));
        btnSend.disabled = false;
        btnSend.innerHTML = `<i class="fas fa-redo"></i> ${Lang.get('email.retry')}`;
        btnSend.style.background = '#dc3545';
        setTimeout(() => {
            btnSend.innerHTML = originalBtnText;
            btnSend.style.background = '';
        }, 3000);
    }
};

window.setActionButtonError = (button, message = 'Foto Tidak tersedia') => {
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
};

window.setActionButtonPending = (button, message = 'Foto Masih Di Proses') => {
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
};

window.checkPhotoStatusBeforeAction = (actionName = 'aksi') => {
    const booth = window.booth;
    if (!booth) {
        return { allowed: false, reason: 'boothNotReady' };
    }
    const photoStatus = booth.getPhotoStatus();
    if (photoStatus.status === 'pending') {
        return { allowed: false, reason: 'pending', key: photoStatus.key };
    }
    if (photoStatus.status === 'none' || !photoStatus.filename) {
        return { allowed: false, reason: 'notAvailable' };
    }
    return { allowed: true, filename: photoStatus.filename };
};

window.downloadNow = async () => {
    const statusCheck = window.checkPhotoStatusBeforeAction('Download');
    if (!statusCheck.allowed) {
        const btnDownload = document.querySelector('.btn-download');
        if (statusCheck.reason === 'pending') {
            if (btnDownload) window.setActionButtonPending(btnDownload);
        } else {
            if (btnDownload) window.setActionButtonError(btnDownload);
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
        console.error('Download process error:', e);
        alert(Lang.get('error.prefix') + 'Gagal mengunduh foto');
    }
};

window.printNow = async () => {
    const statusCheck = window.checkPhotoStatusBeforeAction('Print');
    if (!statusCheck.allowed) {
        const btnPrint = document.querySelector('.btn-print');
        if (statusCheck.reason === 'pending') {
            if (btnPrint) window.setActionButtonPending(btnPrint);
        } else {
            if (btnPrint) window.setActionButtonError(btnPrint);
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
        printCanvas.width = img.width || window.booth.cameraConfig.TW;
        printCanvas.height = img.height || window.booth.cameraConfig.TH;
        const ctx = printCanvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0, printCanvas.width, printCanvas.height);

        const blobUrl = printCanvas.toDataURL('image/png');
        const blob = await window.booth.dataURLtoBlob(blobUrl);
        const objectUrl = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            position: fixed;
            left: -9999px;
            top: -9999px;
            width: 100%;
            height: 100%;
        `;
        document.body.appendChild(iframe);

        let printFired = false;
        const doPrint = () => {
            if (printFired) return;
            printFired = true;
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.error('Print failed:', e);
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
        console.error('Print process error:', e);
        alert(Lang.get('error.prefix') + 'Gagal menyiapkan foto untuk dicetak');
    }
};

document.getElementById('printModal').addEventListener('click', function(e) {
    if (e.target === this) window.closeModal();
});

window.closeQRModal = () => {
    window.booth.ui.hideQRModal();
};

const startBoothCleanupInterval = () => {
    let cleanupInterval = null;
    let monitorInterval = null;
    const cleanupIntervalMs = Config.get('session.cleanupInterval', 900000);
    const monitorIntervalMs = 900000;

    const runCleanup = async () => {
        try {
            const res = await fetch('api/cleanup-photos.php');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new TypeError("Received non-JSON response from server.");
            }
            const data = await res.json();
            if (data.success && data.hasFiles !== undefined) {
                if (!data.hasFiles && cleanupInterval) {
                    clearInterval(cleanupInterval);
                    cleanupInterval = null;
                }
            }
        } catch (e) {
            console.error('Photo cleanup failed:', e);
        }
    };

    const startCleanupLoop = () => {
        if (cleanupInterval) return;
        runCleanup();
        cleanupInterval = setInterval(runCleanup, cleanupIntervalMs);
    };

    const stopCleanupLoop = () => {
        if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
        }
    };

    const monitorFolder = async () => {
        try {
            const res = await fetch('api/cleanup-photos.php');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new TypeError("Received non-JSON response from server.");
            }
            const data = await res.json();
            if (data.success && data.hasFiles !== undefined) {
                if (data.hasFiles) {
                    startCleanupLoop();
                } else {
                    stopCleanupLoop();
                }
            }
        } catch (e) {
            console.error('Folder monitor failed:', e);
        }
    };

    monitorInterval = setInterval(monitorFolder, monitorIntervalMs);
    monitorFolder();
};

document.addEventListener('DOMContentLoaded', () => {
    startBoothCleanupInterval();
});

window.openQRModal = async () => {
    const booth = window.booth;
    const ui = booth?.ui;

    if (!booth || !ui) return;

    const statusCheck = window.checkPhotoStatusBeforeAction('QR');
    if (!statusCheck.allowed) {
        const btnQr = document.querySelector('.btn-qr');
        if (statusCheck.reason === 'pending') {
            if (btnQr) window.setActionButtonPending(btnQr);
        } else {
            if (btnQr) window.setActionButtonError(btnQr);
        }
        return;
    }

    ui.showQRModal();
    ui.setQRLoading(true);

    try {
        const baseUrl = window.location.protocol + '//' + window.location.host;
        const qrUrl = `${baseUrl}/api/generate-qr.php?filename=${encodeURIComponent(statusCheck.filename)}`;

        const qrImage = document.getElementById('qrImage');
        qrImage.onload = function() {
            ui.setQRLoading(false);
        };
        qrImage.onerror = function() {
            console.error('Failed to load QR image');
            alert('Failed to generate QR code');
            ui.hideQRModal();
        };
        ui.setQRImage(qrUrl);

    } catch (e) {
        console.error('QR Modal Error:', e);
        ui.showToastMessage('Error: ' + e.message);
        alert(Lang.get('error.prefix') + e.message);
        ui.hideQRModal();
    }
};