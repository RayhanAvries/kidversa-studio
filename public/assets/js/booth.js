import { CameraManager } from './modules/CameraManager.js';
import { FilterEngine } from './modules/FilterEngine.js';
import { FrameManager } from './modules/FrameManager.js';
import { BoothUI } from './modules/BoothUI.js';
import { Config } from './modules/Config.js';
import { SessionManager } from './modules/SessionManager.js';
import { Lang } from './modules/Lang.js';
import { initPermissions } from './modules/InitPermissions.js';

export class Booth {
    constructor() {
        console.log('[Booth] Constructor started');
        window.booth = this;
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
        this.finalData = null;
        this.currentSavedFile = null;
        
        console.log('BoothUI instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.ui)));
        this.sessionManager = new SessionManager(
            { timer: Config.get('session.timer', 90) },
            () => this.handleSessionEnd(),
            (timeLeft) => this.ui.updateTimer(timeLeft),
            () => {
                if (typeof this.ui.showTimeUpWarning === 'function') {
                    this.ui.showTimeUpWarning();
                } else {
                    console.error('showTimeUpWarning is undefined on ui:', this.ui);
                }
            }
        );
        
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

        this.sessionManager.start();
        this.ui.updateTimer(this.sessionManager.getTimeLeft());
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

    handleSessionEnd() {
        this.ui.updateTimer(0);
        this.ui.showToastMessage(Lang.get('timeUpWarning'));
        if (this.captured && !this.finalData) {
            this.finish();
        }
    }

    startCountdown() {
        if (!this.camera.ready || this.counting) return;
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
                if (this.sessionManager.isActive()) this.ui.setCaptureButtonState(false);
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
        
        this.ui.setCaptureControls('captured');
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
            
            // Use cropping instead of stretching to maintain aspect ratio
            const imgWidth = img.width;
            const imgHeight = img.height;
            const canvasWidth = this.camera.cnv.width;
            const canvasHeight = this.camera.cnv.height;
            
            // Calculate the aspect ratios
            const imgRatio = imgWidth / imgHeight;
            const canvasRatio = canvasWidth / canvasHeight;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            // Determine crop dimensions based on aspect ratios
            if (imgRatio > canvasRatio) {
                // Image is wider than canvas - crop sides
                drawHeight = imgHeight;
                drawWidth = imgHeight * canvasRatio;
                offsetX = (imgWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Image is taller than canvas - crop top/bottom
                drawWidth = imgWidth;
                drawHeight = imgWidth / canvasRatio;
                offsetX = 0;
                offsetY = (imgHeight - drawHeight) / 2;
            }
            
            // Draw the cropped image
            ctx.drawImage(
                img,
                offsetX, offsetY, drawWidth, drawHeight,  // Source rectangle (cropped)
                0, 0, canvasWidth, canvasHeight  // Destination rectangle (full canvas)
            );
            ctx.filter = 'none';
        };
        img.src = this.captured;
        this.frames.loadFrame();
    }

    async retake() {
        this.captured = null;
        this.finalData = null;
        this.currentSavedFile = null;
        document.getElementById('camVideo').style.display = 'block';
        document.getElementById('camCanvas').style.display = 'none';
        this.frames.loadFrame();
        
        const f = this.filters.applyFilter(this.selFilter);
        document.getElementById('filterFx').style.display = f.overlay ? 'block' : 'none';
        document.getElementById('camCanvas').style.filter = 'none';
        
        this.camera.ctx.clearRect(0, 0, this.camera.cnv.width, this.camera.cnv.height);
        this.ui.setCaptureControls('capture');
        this.ui.setCaptureButtonState(false);
        this.ui.timerEl?.classList.remove('warn');
        
        if (this.sessionManager) {
            this.sessionManager.reset();
            this.ui.updateTimer(this.sessionManager.getTimeLeft());
        }
        
        await this.camera.start();
        this.filters.initPreviews(this.camera.stream);
    }

    async finish() {
        if (!this.captured) return;

        const getLocation = () => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    resolve({ lat: -6.9175, lng: 107.6191, name: 'Bandung' });
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            name: 'Kidversa Studio, Bandung'
                        });
                    },
                    () => {
                        resolve({ lat: -6.9175, lng: 107.6191, name: 'Bandung' });
                    },
                    { timeout: 5000 }
                );
            });
        };

        const location = await getLocation();
        const success = await this.genFinal();

        if (!success && !this.finalData) {
            await this.useCapturedData();
        }

        if (!this.finalData) {
            console.error('No valid image data available after genFinal');
            alert('Failed to prepare photo. Please try again.');
            return;
        }

        try {
            const saveRes = await fetch('api/save-photo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: this.finalData,
                    metadata: { location }
                })
            });
            const saveData = await saveRes.json();

            if (saveData.success) {
                this.currentSavedFile = saveData.filename;
            }
        } catch (e) {
            console.error('Failed to save photo on finish:', e);
        }

        this.ui.showPrintModal();
    }

    async useCapturedData() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.cameraConfig.TW;
        tempCanvas.height = this.cameraConfig.TH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        const tempImg = new Image();
        await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            tempImg.src = this.captured;
        });

        const filterResult = this.filters.applyFilter(this.selFilter);
        tempCtx.filter = filterResult.filter;
        
        // Use cropping instead of stretching to maintain aspect ratio
        const imgWidth = tempImg.width;
        const imgHeight = tempImg.height;
        const canvasWidth = tempCanvas.width;
        const canvasHeight = tempCanvas.height;
        
        // Calculate the aspect ratios
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        // Determine crop dimensions based on aspect ratios
        if (imgRatio > canvasRatio) {
            // Image is wider than canvas - crop sides
            drawHeight = imgHeight;
            drawWidth = imgHeight * canvasRatio;
            offsetX = (imgWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas - crop top/bottom
            drawWidth = imgWidth;
            drawHeight = imgWidth / canvasRatio;
            offsetX = 0;
            offsetY = (imgHeight - drawHeight) / 2;
        }
        
        // Draw the cropped image
        tempCtx.drawImage(
            tempImg,
            offsetX, offsetY, drawWidth, drawHeight,  // Source rectangle (cropped)
            0, 0, canvasWidth, canvasHeight  // Destination rectangle (full canvas)
        );
        tempCtx.filter = 'none';

        this.finalData = tempCanvas.toDataURL('image/png', 1);
    }

    genFinal() {
        return new Promise((resolve) => {
            const fc = document.createElement('canvas');
            fc.width = this.cameraConfig.TW;
            fc.height = this.cameraConfig.TH;
            const fctx = fc.getContext('2d');
            fctx.fillStyle = '#ffffff';
            fctx.fillRect(0, 0, fc.width, fc.height);
            
            const img = new Image();
            img.onload = () => {
                fctx.filter = this.filters.applyFilter(this.selFilter).filter;
                
                // Use cropping instead of stretching to maintain aspect ratio
                const imgWidth = img.width;
                const imgHeight = img.height;
                const canvasWidth = fc.width;
                const canvasHeight = fc.height;
                
                // Calculate the aspect ratios
                const imgRatio = imgWidth / imgHeight;
                const canvasRatio = canvasWidth / canvasHeight;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                // Determine crop dimensions based on aspect ratios
                if (imgRatio > canvasRatio) {
                    // Image is wider than canvas - crop sides
                    drawHeight = imgHeight;
                    drawWidth = imgHeight * canvasRatio;
                    offsetX = (imgWidth - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    // Image is taller than canvas - crop top/bottom
                    drawWidth = imgWidth;
                    drawHeight = imgWidth / canvasRatio;
                    offsetX = 0;
                    offsetY = (imgHeight - drawHeight) / 2;
                }
                
                // Draw the cropped image
                fctx.drawImage(
                    img,
                    offsetX, offsetY, drawWidth, drawHeight,  // Source rectangle (cropped)
                    0, 0, canvasWidth, canvasHeight  // Destination rectangle (full canvas)
                );
                fctx.filter = 'none';
                
                const fi = new Image();
                fi.onload = () => {
                    fctx.drawImage(fi, 0, 0, fc.width, fc.height);
                    this.finalData = fc.toDataURL('image/png', 1);
                    resolve(true);
                };
                fi.onerror = () => {
                    this.finalData = fc.toDataURL('image/png', 1);
                    console.log('Frame image load failed, using captured data without frame');
                    resolve(false);
                };
                fi.src = `${Config.paths().frames}/${this.frames.selFrame}.png`;
            };
            img.onerror = () => {
                console.error('Main image load failed, cannot generate final photo');
                this.finalData = null;
                resolve(false);
            };
            img.src = this.captured;
        });
    }

    destroy() {
        this.filters.stopPreviews();
        this.camera.stop();
        this.sessionManager.destroy();
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

    const emailRegex = Config.email().regex;
    if (!emailRegex.test(email)) {
        emailError.style.display = 'block';
        emailInput.style.borderColor = 'red';
        return;
    }

    emailError.style.display = 'none';
    emailInput.style.borderColor = '';

    let locationStr = Lang.get('location.notAvailable');
    try {
        if (window.__appPermissions && window.__appPermissions.position) {
            const pos = window.__appPermissions.position;
            locationStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        } else {
            console.warn('Geolocation not available from InitPermissions, using fallback');
            locationStr = window.__appPermissions && window.__appPermissions.DEFAULT_LOCATION ? window.__appPermissions.DEFAULT_LOCATION : 'Bandung Jawabarat';
        }
    } catch (e) {
        console.warn('Geolocation failed:', e);
    }

    let imageData = window.booth.finalData;
    if (!imageData) {
        console.log('Calling genFinal() from sendEmail due to missing finalData');
        await window.booth.genFinal();
        imageData = window.booth.finalData;
    }

    if (!imageData) {
        console.error('Image data still missing after genFinal() call');
        alert('Image data is missing. Please try taking a photo again.');
        return;
    }

    const payload = {
         email: email,
         image: imageData,
         metadata: {
             timestamp: new Date().toLocaleString(Config.get('locale', 'id-ID')),
             location: locationStr
         }
      };

    const originalBtnText = btnSend.innerHTML;
    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const res = await fetch('api/send-email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
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

window.printNow = () => {
    if (!window.booth?.finalData) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) {
        alert(Lang.get('print.allowPopups'));
        return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>Print</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}img{max-width:100%;height:auto}</style></head><body><img src="${this.finalData}"></body></html>`);
    w.document.close();
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
    if (!booth?.finalData) {
        if (!booth?.captured) {
            booth.ui.showToastMessage(Lang.get('photo.notReady'));
            return;
        }
        await booth.genFinal();
        if (!booth.finalData) {
            booth.ui.showToastMessage(Lang.get('photo.notReady'));
            return;
        }
    }

    const ui = booth.ui;
    ui.showQRModal();
    ui.setQRLoading(true);

    try {
        let filename = booth.currentSavedFile;

        if (!filename) {
            const saveRes = await fetch('api/save-photo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: booth.finalData })
            });
            const saveData = await saveRes.json();

            if (!saveData.success) {
                throw new Error(saveData.message || 'Failed to save photo');
            }

            filename = saveData.filename;
            booth.currentSavedFile = filename;
        }

        if (!filename || typeof filename !== 'string' || filename.trim() === '') {
            throw new Error('Valid filename not available');
        }

        const baseUrl = window.location.protocol + '//' + window.location.host;
        const qrUrl = `${baseUrl}/api/generate-qr.php?filename=${encodeURIComponent(filename)}`;
        
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
        alert(Lang.get('error.prefix') + e.message);
        ui.hideQRModal();
    }
};
