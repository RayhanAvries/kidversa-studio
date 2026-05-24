export class FrameManager {
    constructor() {
        this.frameImg = document.getElementById('frameImg');
        this.frameRow = document.getElementById('frameRow');
        this.selFrame = '';
        this.frameFiles = [];
    }

    async loadFrameList() {
        try {
            const response = await fetch('api/frames.php');
            if (response.ok) {
                const data = await response.json();
                this.frameFiles = data.frames || [];
            }
        } catch (e) {
            console.error('Failed to load frames:', e);
        }
        if (this.frameFiles.length === 0) {
            this.frameFiles = ['kidversa', 'koran'];
        }
    }

    buildFrameUI() {
        this.frameRow.innerHTML = '';
        this.frameFiles.forEach((name, i) => {
            const displayName = name.replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
            const d = document.createElement('div');
            d.className = `frame-card${i === 0 ? ' sel' : ''}`;
            d.dataset.frame = name;
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
            d.innerHTML = `<div class="frame-thumb"><img src="${baseUrl}/assets/img/frames/${name}.png" alt="${displayName}" onerror="this.style.display='none'"></div><div class="frame-label">${displayName}</div>`;
            this.frameRow.appendChild(d);
        });
    }

    loadFrame() {
        const img = new Image();
        img.onload = () => {
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
            this.frameImg.src = `${baseUrl}/assets/img/frames/${this.selFrame}.png`;
            this.frameImg.style.display = 'block';
        };
        img.onerror = () => {
            this.frameImg.style.display = 'none';
        };
            const baseUrl = window.APP_CONFIG?.BASE_URL || '';
        img.src = `${baseUrl}/assets/img/frames/${this.selFrame}.png`;
    }

    setFrame(frameName) {
        this.selFrame = frameName;
        this.loadFrame();
    }
}