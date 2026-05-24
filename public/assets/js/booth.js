import { CameraManager } from './modules/CameraManager.js';
import { FilterEngine } from './modules/FilterEngine.js';
import { FrameManager } from './modules/FrameManager.js';
import { BoothUI } from './modules/BoothUI.js';

class Booth {
    constructor() {
        this.config = {
            TW: 1920,
            TH: 1080
        };
        
        this.ui = new BoothUI();
        this.camera = new CameraManager(this.config);
        this.frames = new FrameManager();
        this.filters = null;
        
        this.selFilter = 'none';
        this.captured = null;
        this.finalData = null;
        this.currentSavedFile = null;
        this.timeLeft = 90;
        this.timer = null;
        this.active = true;
        this.lastChance = false;
        this.counting = false;

        this.init();
    }

    async init() {
        try {
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
            const filterRes = await fetch(`${baseUrl}/assets/config/filters.json`);
            const filterData = await filterRes.json();
            this.filters = new FilterEngine({ filters: filterData });

            await this.frames.loadFrameList();
            this.filters.buildFilterUI();
            this.frames.buildFrameUI();
            this.bindEvents();

            if (this.frames.frameFiles.length > 0) {
                this.frames.setFrame(this.frames.frameFiles[0]);
            }

            await this.camera.start();
            this.ui.setCaptureButtonState(false);
            this.filters.applyFilter(this.selFilter);
            this.filters.initPreviews(this.camera.stream);
            this.startTimer();
        } catch (e) {
            console.error('Booth initialization failed:', e);
            this.ui.setCaptureButtonText('<i class="fas fa-sync"></i>Retry', '');
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
            if (this.captured) this.showCaptured();
        });

        document.getElementById('frameRow').addEventListener('click', e => {
            const c = e.target.closest('.frame-card');
            if (!c) return;
            document.querySelectorAll('.frame-card').forEach(el => el.classList.remove('sel'));
            c.classList.add('sel');
            this.frames.setFrame(c.dataset.frame);
            if (this.captured) this.showCaptured();
        });

        this.ui.btnCap.addEventListener('click', () => this.startCountdown());
        this.ui.btnRet.addEventListener('click', () => this.retake());
        this.ui.btnDone.addEventListener('click', () => this.finish());

        document.addEventListener('touchmove', e => {
            if (!e.target.closest('.scroll-row')) e.preventDefault();
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
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.updateTimer(this.timeLeft);
            if (this.timeLeft <= 0) this.endSession();
        }, 1000);
    }

    endSession() {
        clearInterval(this.timer);
        this.active = false;
        this.ui.updateTimer(0);
        if (!this.captured) {
            this.lastChance = true;
            this.ui.showToast();
        } else {
            this.ui.setCaptureButtonState(true);
        }
    }

    startCountdown() {
        if (!this.camera.ready || this.counting) return;
        if (!this.active && this.lastChance) {
            this.capture();
            return;
        }
        this.counting = true;
        this.ui.setCaptureButtonState(true);
        let c = 3;
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
                if (this.active) this.ui.setCaptureButtonState(false);
            }
        }, 1000);
    }

    capture() {
        this.filters.stopPreviews();
        this.captured = this.camera.getCanvasData();
        this.camera.stop();
        this.showCaptured();
        
        document.getElementById('camVideo').style.display = 'none';
        document.getElementById('camCanvas').style.display = 'block';
        document.getElementById('camCanvas').style.filter = this.filters.applyFilter(this.selFilter).filter;
        document.getElementById('filterFx').style.display = 'none';
        
        this.ui.setCaptureControls(this.active ? 'captured' : 'done');
        this.ui.scrollToTop();
    }

    showCaptured() {
        if (!this.captured) return;
        const img = new Image();
        img.onload = () => {
            this.camera.updateCanvas();
            const ctx = this.camera.ctx;
            ctx.clearRect(0, 0, this.camera.cnv.width, this.camera.cnv.height);
            ctx.filter = this.filters.applyFilter(this.selFilter).filter;
            ctx.drawImage(img, 0, 0, this.camera.cnv.width, this.camera.cnv.height);
            ctx.filter = 'none';
        };
        img.src = this.captured;
        this.frames.loadFrame();
    }

    async retake() {
        if (!this.active && this.lastChance) return;
        this.captured = null;
        this.finalData = null;
        document.getElementById('camVideo').style.display = 'block';
        document.getElementById('camCanvas').style.display = 'none';
        this.frames.loadFrame();
        
        const f = this.filters.applyFilter(this.selFilter);
        document.getElementById('filterFx').style.display = f.overlay ? 'block' : 'none';
        document.getElementById('camCanvas').style.filter = 'none';
        
        this.camera.ctx.clearRect(0, 0, this.camera.cnv.width, this.camera.cnv.height);
        this.ui.setCaptureControls('capture');
        this.ui.setCaptureButtonState(false);
        
        await this.camera.start();
        this.filters.initPreviews(this.camera.stream);
    }

    finish() {
        if (!this.captured) return;
        this.genFinal(() => {
            this.ui.showPrintModal();
        });
    }

    genFinal(cb) {
        const fc = document.createElement('canvas');
        fc.width = this.config.TW;
        fc.height = this.config.TH;
        const fctx = fc.getContext('2d');
        fctx.fillStyle = '#FFF';
        fctx.fillRect(0, 0, fc.width, fc.height);
        
        const img = new Image();
        img.onload = () => {
            fctx.filter = this.filters.applyFilter(this.selFilter).filter;
            fctx.drawImage(img, 0, 0, fc.width, fc.height);
            fctx.filter = 'none';
            
            const fi = new Image();
            fi.onload = () => {
                fctx.drawImage(fi, 0, 0, fc.width, fc.height);
                this.finalData = fc.toDataURL('image/png', 1);
                cb();
            };
            fi.onerror = () => {
                this.finalData = fc.toDataURL('image/png', 1);
                cb();
            };
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
            fi.src = `${baseUrl}/assets/img/frames/${this.frames.selFrame}.png`;
        };
        img.onerror = () => {
            this.finalData = null;
            cb();
        };
        img.src = this.captured;
    }

    destroy() {
        this.filters.stopPreviews();
        this.camera.stop();
        if (this.timer) clearInterval(this.timer);
    }
}

window.booth = new Booth();

window.addEventListener('beforeunload', () => {
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

window.openEmailModal = () => {
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

    const gmailRegex = /^[a-z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) {
        emailError.style.display = 'block';
        emailInput.style.borderColor = '#ef4444';
        return;
    }

    emailError.style.display = 'none';
    emailInput.style.borderColor = '#ddd';

    let locationStr = 'Location not available';
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locationStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    } catch (e) {
        console.warn('Geolocation failed:', e);
    }

    const payload = {
        email: email,
        image: window.booth.finalData,
        metadata: {
            timestamp: new Date().toLocaleString(),
            location: locationStr
        }
    };

    const originalBtnText = btnSend.innerHTML;
    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const baseUrl = window.APP_CONFIG?.BASE_URL || '';
        const res = await fetch(`${baseUrl}/api/send-email.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            btnSend.innerHTML = '<i class="fas fa-check"></i> Success';
            btnSend.style.background = '#059669';
            
            let countdown = 10;
            const timer = setInterval(() => {
                if (countdown > 0) {
                    btnSend.innerHTML = `Modal akan ditutup dalam ${countdown} detik`;
                    countdown--;
                } else {
                    clearInterval(timer);
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
        alert('Error: ' + e.message);
        btnSend.disabled = false;
        btnSend.innerHTML = '<i class="fas fa-redo"></i> Gagal, coba lagi';
        btnSend.style.background = '#ef4444';
        setTimeout(() => {
            btnSend.innerHTML = originalBtnText;
            btnSend.style.background = '';
        }, 3000);
    }
};

window.printNow = () => {
    if (!window.booth?.finalData) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) {
        alert('Allow pop-ups to print');
        return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{@page{size:210mm 148mm landscape;margin:0}body{margin:0;width:210mm;height:148mm;display:flex;justify-content:center;align-items:center}img{width:210mm;height:148mm;object-fit:contain}}</style></head><body><img src="${window.booth.finalData}" onload="setTimeout(function(){window.print()},400)"></body></html>`);
    w.document.close();
};

document.getElementById('printModal').addEventListener('click', function(e) {
    if (e.target === this) window.closeModal();
});

window.closeQRModal = () => {
    window.booth.ui.hideQRModal();
};

// Pemicu cleanup background setiap 30 detik pada layar booth (take-photo.php)
const startBoothCleanupInterval = () => {
    const runCleanup = async () => {
        try {
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
            await fetch(`${baseUrl}/api/cleanup-photos.php`);
        } catch (e) {
            console.error('Photo cleanup failed:', e);
        }
    };
    runCleanup();
    setInterval(runCleanup, 30000);
};

document.addEventListener('DOMContentLoaded', () => {
    startBoothCleanupInterval();
});

window.openQRModal = async () => {
    if (!window.booth?.finalData) {
        alert('Photo not ready yet');
        return;
    }

    const ui = window.booth.ui;
    ui.showQRModal();
    ui.setQRLoading(true);

    try {
        const baseUrl = window.APP_CONFIG?.BASE_URL || '';
        const saveRes = await fetch(`${baseUrl}/api/save-photo.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: window.booth.finalData })
        });
        const saveData = await saveRes.json();

        if (!saveData.success) {
            throw new Error(saveData.message || 'Failed to save photo');
        }

        window.booth.currentSavedFile = saveData.filename;

        const baseUrl = window.APP_CONFIG?.BASE_URL || '';
        const qrUrl = `${baseUrl}/api/generate-qr.php?filename=${encodeURIComponent(saveData.filename)}`;
        
        ui.setQRImage(qrUrl);
        ui.setQRLoading(false);

    } catch (e) {
        console.error('QR Modal Error:', e);
        alert('Error: ' + e.message);
        ui.hideQRModal();
    }
};