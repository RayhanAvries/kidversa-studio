export class CameraManager {
    constructor(config) {
        this.TW = config.TW;
        this.TH = config.TH;
        this.FALLBACK_TW = config.FALLBACK_TW || 1280;
        this.FALLBACK_TH = config.FALLBACK_TH || 720;
        this.vid = document.getElementById('camVideo');
        this.cnv = document.getElementById('camCanvas');
        this.ctx = this.cnv.getContext('2d');
        this.box = document.getElementById('photoBox');
        this.stream = null;
        this.raf = null;
        this.ready = false;
    }
    async start() {
        this.ready = false;
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            await this.setupVid();
        } catch (e) {
            console.warn('[CameraManager] Primary camera request failed, attempting fallback', e);
            await this.fallback();
        }
    }
    async fallback() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: this.FALLBACK_TW }, height: { ideal: this.FALLBACK_TH }, facingMode: 'user' },
                audio: false
            });
            await this.setupVid();
        } catch (e) {
            await this.any();
        }
    }
    async any() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            await this.setupVid();
        } catch (e) {
            this.ready = false;
            console.error('Camera access denied, cannot proceed', e);
        }
    }
    async setupVid() {
        this.vid.srcObject = this.stream;
        this.vid.onloadedmetadata = () => {
            this.updateCanvas();
            this.ready = true;
            this.startDraw();
        };
        try {
            await this.vid.play();
        } catch (e) {
            if (e.name === 'AbortError') {
                console.warn('[CameraManager] Play request interrupted (AbortError). This is often normal during rapid re-initialization.');
            } else {
                console.warn('[CameraManager] Autoplay prevented, waiting for interaction', e);
            }
        }
    }
    updateCanvas() {
        const r = this.box.getBoundingClientRect();
        const w = Math.floor(r.width);
        const h = Math.floor(r.height);
        if (w > 0 && h > 0 && (this.cnv.width !== w || this.cnv.height !== h)) {
            this.cnv.width = w;
            this.cnv.height = h;
        }
    }
    startDraw(onDraw) {
        if (this.raf) cancelAnimationFrame(this.raf);
        const draw = () => {
            if (this.vid.readyState >= 2 && this.ready) {
                this.updateCanvas();
                if (this.cnv.width > 0) {
                    this.ctx.save();
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(this.vid, -this.cnv.width, 0, this.cnv.width, this.cnv.height);
                    this.ctx.restore();
                }
            }
            this.raf = requestAnimationFrame(draw);
        };
        draw();
    }
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }
    getCanvasData() {
        return this.cnv.toDataURL('image/png');
    }
}
