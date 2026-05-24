export class CameraManager {
    constructor(config) {
        this.TW = config.TW;
        this.TH = config.TH;
        this.vid = document.getElementById('camVideo');
        this.cnv = document.getElementById('camCanvas');
        this.ctx = this.cnv.getContext('2d');
        this.box = document.getElementById('photoBox');
        this.stream = null;
        this.raf = null;
        this.ready = false;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: this.TW }, height: { ideal: this.TH }, facingMode: 'user', aspectRatio: { ideal: 16/9 } },
                audio: false
            });
            await this.setupVid();
        } catch (e) {
            await this.fallback();
        }
    }

    async fallback() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
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
            throw new Error('Camera access denied');
        }
    }

    async setupVid() {
        this.vid.srcObject = this.stream;
        this.vid.onloadedmetadata = () => {
            this.updateCanvas();
            this.ready = true;
            this.startDraw();
        };
        await this.vid.play();
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