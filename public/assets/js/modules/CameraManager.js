import { ImageComposer } from './ImageComposer.js';

export class CameraManager {
  constructor(config) {
    this.TW = config.TW;
    this.TH = config.TH;
    this.FALLBACK_TW = config.FALLBACK_TW || 1280;
    this.FALLBACK_TH = config.FALLBACK_TH || 720;
    this.vid = document.getElementById("camVideo");
    this.cnv = document.getElementById("camCanvas");
    this.ctx = this.cnv.getContext("2d");
    this.box = document.getElementById("photoBox");
    this.stream = null;
    this.raf = null;
    this.ready = false;
    this.mirrorH = false;
    this.mirrorV = false;
    this.currentDeviceId = null;
    this.devices = [];
  }
  async start() {
    this.ready = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    try {
      const constraints = this.currentDeviceId
        ? { video: { deviceId: { exact: this.currentDeviceId } }, audio: false }
        : { video: true, audio: false };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      await this.setupVid();
    } catch (e) {
      console.warn(
        "[CameraManager] Primary camera request failed, attempting fallback",
        e,
      );
      this.currentDeviceId = null;
      await this.fallback();
    }
  }
  async fallback() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.FALLBACK_TW },
          height: { ideal: this.FALLBACK_TH },
          facingMode: "user",
        },
        audio: false,
      });
      await this.setupVid();
    } catch (e) {
      await this.any();
    }
  }
  async any() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      await this.setupVid();
    } catch (e) {
      this.ready = false;
      console.error("Camera access denied, cannot proceed", e);
    }
  }
  async setupVid() {
    this.vid.pause();
    this.vid.srcObject = null;
    this.vid.srcObject = this.stream;
    this._updateVideoTransform();
    this.vid.onloadedmetadata = () => {
      this.updateCanvas();
      this.ready = true;
      this.startDraw();
    };
    try {
      await this.vid.play();
    } catch (e) {
      if (e.name === "AbortError") {
        console.warn(
          "[CameraManager] Play request interrupted (AbortError). This is often normal during rapid re-initialization.",
        );
      } else {
        console.warn(
          "[CameraManager] Autoplay prevented, waiting for interaction",
          e,
        );
      }
    }
  }
  updateCanvas() {
    const r = this.box.getBoundingClientRect();
    const w = Math.floor(r.width);
    const h = Math.floor(r.height);

    const targetWidth = w;
    const targetHeight = Math.round((w * 9) / 16);

    if (
      targetWidth > 0 &&
      targetHeight > 0 &&
      (this.cnv.width !== targetWidth || this.cnv.height !== targetHeight)
    ) {
      this.cnv.width = targetWidth;
      this.cnv.height = targetHeight;
    }
  }
  startDraw() {
    if (this.raf) cancelAnimationFrame(this.raf);
    const draw = () => {
      if (this.vid.readyState >= 2 && this.ready) {
        this.updateCanvas();
        if (this.cnv.width > 0) {
          this.ctx.save();
          if (this.mirrorH) {
            this.ctx.translate(this.cnv.width, 0);
            this.ctx.scale(-1, 1);
          }
          if (this.mirrorV) {
            this.ctx.translate(0, this.cnv.height);
            this.ctx.scale(1, -1);
          }

          ImageComposer.fitAndDraw(this.ctx, this.vid, this.cnv.width, this.cnv.height, null);

          this.ctx.restore();
        }
      }
      this.raf = requestAnimationFrame(draw);
    };
    draw();
  }
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.ready = false;
    this.vid.srcObject = null;
  }
  getCanvasData() {
    return this.cnv.toDataURL("image/png");
  }

  async getDevices() {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.devices = allDevices.filter(d => d.kind === 'videoinput');
      return this.devices;
    } catch (e) {
      console.warn('[CameraManager] enumerateDevices failed', e);
      this.devices = [];
      return this.devices;
    }
  }

  async startWithDevice(deviceId) {
    this.ready = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      this.currentDeviceId = deviceId;
      await this.setupVid();
    } catch (e) {
      console.warn('[CameraManager] startWithDevice failed, falling back to default', e);
      this.currentDeviceId = null;
      await this.start();
    }
  }

  setMirrorH(enabled) {
    this.mirrorH = enabled;
    this._updateVideoTransform();
  }

  setMirrorV(enabled) {
    this.mirrorV = enabled;
    this._updateVideoTransform();
  }

  _updateVideoTransform() {
    let transform = '';
    if (this.mirrorH) transform += 'scaleX(-1) ';
    if (this.mirrorV) transform += 'scaleY(-1) ';
    this.vid.style.transform = transform.trim();
  }
}
