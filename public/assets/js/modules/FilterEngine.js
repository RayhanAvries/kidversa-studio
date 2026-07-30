export class FilterEngine {
  constructor(config) {
    this.filters = config.filters;
    this.fxOverlay = document.getElementById("filterFx");
    this.filterRow = document.getElementById("filterRow");
    this.vid = document.getElementById("camVideo");
    this.cnv = document.getElementById("camCanvas");
    this.getMirrorState = config.getMirrorState || (() => ({ mirrorH: false, mirrorV: false }));
  }
  applyFilter(filterId) {
    const f = this.filters.find((x) => x.id === filterId);
    if (!f) return null;

    this.vid.style.filter = f.filter;
    this.cnv.style.filter = f.filter;
    this.fxOverlay.style.background = f.overlay;
    this.fxOverlay.style.display = f.overlay ? "block" : "none";

    return f;
  }
  buildFilterUI() {
    this.filterRow.innerHTML = "";
    this.filters.forEach((f, i) => {
      const d = document.createElement("div");
      d.className = `filter-card${i === 0 ? " sel" : ""}`;
      d.dataset.filter = f.id;
      d.innerHTML = `<div class="filter-thumb"><canvas id="fc${f.id}"></canvas></div><div class="filter-label">${f.name}</div>`;
      this.filterRow.appendChild(d);
    });
  }
  async initPreviews(stream) {
    this.masterVideo = document.createElement("video");
    this.masterVideo.muted = true;
    this.masterVideo.autoplay = true;
    this.masterVideo.playsInline = true;
    this.masterVideo.srcObject = stream;
    this.masterVideo.style.position = "fixed";
    this.masterVideo.style.top = "-9999px";
    document.body.appendChild(this.masterVideo);
    await this.masterVideo.play().catch(() => {});

    this.previewCanvases = this.filters.map((f) => ({
      canvas: document.getElementById(`fc${f.id}`),
      filter: f.filter,
      overlay: f.overlay,
    }));
    this.startPreviewLoop();
  }
  startPreviewLoop() {
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
    let lastFrame = 0;
    const targetFPS = 15;
    const frameInterval = 1000 / targetFPS;

    const loop = (timestamp) => {
      this.previewRaf = requestAnimationFrame(loop);

      if (timestamp - lastFrame < frameInterval) return;
      lastFrame = timestamp;

      if (this.masterVideo.readyState >= 2 && this.masterVideo.videoWidth > 0) {
        this.previewCanvases.forEach((item) => {
          if (item.canvas) {
            item.canvas.width = 52;
            item.canvas.height = 29;
            const ctx = item.canvas.getContext("2d");
            ctx.filter = item.filter;
            ctx.save();
            const mirror = this.getMirrorState();
            if (mirror.mirrorH) {
              ctx.translate(52, 0);
              ctx.scale(-1, 1);
            }
            if (mirror.mirrorV) {
              ctx.translate(0, 29);
              ctx.scale(1, -1);
            }
            try {
              if (mirror.mirrorH) {
                ctx.drawImage(this.masterVideo, 0, 0, 52, 29);
              } else {
                ctx.drawImage(this.masterVideo, -52, 0, 52, 29);
              }
            } catch (e) {}
            ctx.restore();
            ctx.filter = "none";
            if (item.overlay) {
              ctx.fillStyle = item.overlay;
              ctx.fillRect(0, 0, 52, 29);
            }
          }
        });
      }
    };

    this.previewRaf = requestAnimationFrame(loop);
  }
  stopPreviews() {
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
    this.previewRaf = null;
    if (this.masterVideo) {
      this.masterVideo.srcObject = null;
      if (this.masterVideo.parentNode)
        this.masterVideo.parentNode.removeChild(this.masterVideo);
    }
    this.masterVideo = null;
    this.previewCanvases = [];
  }
}
