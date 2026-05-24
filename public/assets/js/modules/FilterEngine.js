export class FilterEngine {
    constructor(config) {
        this.filters = config.filters;
        this.fxOverlay = document.getElementById('filterFx');
        this.filterRow = document.getElementById('filterRow');
        this.vid = document.getElementById('camVideo');
        this.cnv = document.getElementById('camCanvas');
    }

    applyFilter(filterId) {
        const f = this.filters.find(x => x.id === filterId);
        if (!f) return null;

        this.vid.style.filter = f.filter;
        this.cnv.style.filter = f.filter;
        this.fxOverlay.style.background = f.overlay;
        this.fxOverlay.style.display = f.overlay ? 'block' : 'none';
        
        return f;
    }

    buildFilterUI() {
        this.filterRow.innerHTML = '';
        this.filters.forEach((f, i) => {
            const d = document.createElement('div');
            d.className = `filter-card${i === 0 ? ' sel' : ''}`;
            d.dataset.filter = f.id;
            d.innerHTML = `<div class="filter-thumb"><video id="fv${f.id}" muted playsinline></video><canvas id="fc${f.id}"></canvas></div><div class="filter-label">${f.name}</div>`;
            this.filterRow.appendChild(d);
        });
    }

    async initPreviews(stream) {
        this.previewVideos = [];
        this.filters.forEach(f => {
            const videoEl = document.getElementById(`fv${f.id}`);
            const canvasEl = document.getElementById(`fc${f.id}`);
            if (videoEl && canvasEl) {
                videoEl.srcObject = stream;
                videoEl.play().catch(() => {});
                this.previewVideos.push({ video: videoEl, canvas: canvasEl, filter: f.filter, overlay: f.overlay });
            }
        });
        this.startPreviewLoop();
    }

    startPreviewLoop() {
        if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
        const loop = () => {
            this.previewVideos.forEach(item => {
                if (item.video.readyState >= 2) {
                    item.canvas.width = 52;
                    item.canvas.height = 29;
                    const ctx = item.canvas.getContext('2d');
                    ctx.filter = item.filter;
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(item.video, -52, 0, 52, 29);
                    ctx.restore();
                    ctx.filter = 'none';
                    if (item.overlay) {
                        ctx.fillStyle = item.overlay;
                        ctx.fillRect(0, 0, 52, 29);
                    }
                }
            });
            this.previewRaf = requestAnimationFrame(loop);
        };
        loop();
    }

    stopPreviews() {
        if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
        this.previewRaf = null;
        this.previewVideos.forEach(item => {
            if (item.video) item.video.srcObject = null;
        });
        this.previewVideos = [];
    }
}