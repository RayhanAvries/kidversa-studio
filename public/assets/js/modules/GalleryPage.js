import { ClientQR } from './ClientQR.js';

export class GalleryPage {
    constructor() {
        this.photos = [];
        this.selectedFilename = null;
        this.csrfToken = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalPhotos = 0;
        this.totalSize = 0;
        this.perPage = 25;
        this.printModal = document.getElementById('printModal');
        this.qrModal = document.getElementById('qrModal');
        this.emailModal = document.getElementById('emailModal');
    }

    async init() {
        try {
            const csrfRes = await fetch('api/csrf-token.php');
            if (csrfRes.ok) {
                const data = await csrfRes.json();
                this.csrfToken = data.token;
            }
        } catch (e) {
            console.warn('[Gallery] Failed to load CSRF token:', e);
        }

        this._bindModalEvents();
        await this.loadPhotos();
    }

    async loadPhotos(page = 1) {
        const grid = document.getElementById('galleryGrid');
        const empty = document.getElementById('galleryEmpty');
        const loading = document.getElementById('galleryLoading');
        const stats = document.getElementById('galleryStats');
        const pagination = document.getElementById('galleryPagination');

        if (loading) loading.style.display = 'flex';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (pagination) pagination.style.display = 'none';

        try {
            const res = await fetch(`api/list-photos.php?page=${page}&per_page=${this.perPage}`);
            const data = await res.json();

            if (loading) loading.style.display = 'none';

            if (data.success && data.photos.length > 0) {
                this.photos = data.photos;
                this.currentPage = data.page;
                this.totalPages = data.total_pages;
                this.totalPhotos = data.total;
                this.totalSize = data.total_size;
                this._renderGrid(data.photos);
                this._renderStats(data);
                this._renderPagination();
                if (grid) grid.style.display = 'grid';
                if (stats) stats.style.display = 'block';
                if (pagination) pagination.style.display = data.total_pages > 1 ? 'flex' : 'none';
            } else {
                if (empty) empty.style.display = 'flex';
            }
        } catch (e) {
            console.error('[Gallery] Failed to load photos:', e);
            if (loading) {
                loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal memuat foto';
            }
        }
    }

    _renderGrid(photos) {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        grid.innerHTML = '';

        photos.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.dataset.filename = photo.filename;

            const img = document.createElement('img');
            img.className = 'gallery-card-img';
            img.src = photo.url;
            img.alt = photo.filename;
            img.loading = 'lazy';

            const actions = document.createElement('div');
            actions.className = 'gallery-card-actions';

            const renameBtn = document.createElement('button');
            renameBtn.className = 'gallery-action-btn gallery-action-rename';
            renameBtn.innerHTML = '<i class="fas fa-pen"></i>';
            renameBtn.title = 'Rename';
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._startRename(card, photo.filename);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'gallery-action-btn gallery-action-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._showDeleteConfirm(card, photo.filename);
            });

            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);

            const info = document.createElement('div');
            info.className = 'gallery-card-info';

            const name = document.createElement('div');
            name.className = 'gallery-card-name';
            name.textContent = photo.filename;

            const meta = document.createElement('div');
            meta.className = 'gallery-card-meta';

            const date = document.createElement('div');
            date.className = 'gallery-card-date';
            date.textContent = new Date(photo.modified * 1000).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const size = document.createElement('div');
            size.className = 'gallery-card-size';
            size.textContent = this._formatSize(photo.size);

            meta.appendChild(date);
            meta.appendChild(size);
            info.appendChild(name);
            info.appendChild(meta);
            card.appendChild(img);
            card.appendChild(actions);
            card.appendChild(info);

            card.addEventListener('click', () => this._selectPhoto(photo.filename));

            grid.appendChild(card);
        });
    }

    _renderStats(data) {
        const statTotal = document.getElementById('statTotal');
        const statSize = document.getElementById('statSize');
        const statShowing = document.getElementById('statShowing');
        const statOfTotal = document.getElementById('statOfTotal');

        if (statTotal) statTotal.textContent = data.total;
        if (statSize) statSize.textContent = this._formatSize(data.total_size);
        if (statShowing) statShowing.textContent = data.photos.length;
        if (statOfTotal) statOfTotal.textContent = data.total;
    }

    _renderPagination() {
        const container = document.getElementById('galleryPagination');
        if (!container) return;
        container.innerHTML = '';

        if (this.totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.loadPhotos(this.currentPage - 1));
        container.appendChild(prevBtn);

        const pages = this._getPageNumbers();
        pages.forEach(p => {
            if (p === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            } else {
                const btn = document.createElement('button');
                btn.className = 'page-btn' + (p === this.currentPage ? ' active' : '');
                btn.textContent = p;
                btn.addEventListener('click', () => this.loadPhotos(p));
                container.appendChild(btn);
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => this.loadPhotos(this.currentPage + 1));
        container.appendChild(nextBtn);
    }

    _getPageNumbers() {
        const pages = [];
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (current > 3) pages.push('...');

        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (current < total - 2) pages.push('...');

        pages.push(total);
        return pages;
    }

    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
    }

    _startRename(card, oldFilename) {
        const nameEl = card.querySelector('.gallery-card-name');
        if (!nameEl || nameEl.classList.contains('editing')) return;

        const baseName = oldFilename.replace(/\.[^.]+$/, '');
        const ext = oldFilename.split('.').pop();

        nameEl.classList.add('editing');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'gallery-rename-input';
        input.value = baseName;
        nameEl.textContent = '';
        nameEl.appendChild(input);
        input.focus();
        input.select();

        const finishRename = async (save) => {
            nameEl.classList.remove('editing');
            if (save) {
                const newName = input.value.trim();
                if (newName && newName !== baseName) {
                    await this._renamePhoto(oldFilename, newName + '.' + ext);
                    return;
                }
            }
            nameEl.textContent = oldFilename;
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishRename(true);
            if (e.key === 'Escape') finishRename(false);
        });
        input.addEventListener('blur', () => finishRename(true));
    }

    async _renamePhoto(oldFilename, newFilename) {
        try {
            const res = await fetch('api/rename-photo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_filename: oldFilename,
                    new_filename: newFilename,
                    csrf_token: this.csrfToken
                })
            });

            const data = await res.json();
            if (data.success) {
                await this.loadPhotos(this.currentPage);
            } else {
                alert(data.message || 'Gagal rename file');
                await this.loadPhotos(this.currentPage);
            }
        } catch (e) {
            console.error('[Gallery] Rename error:', e);
            alert('Gagal rename file. Silakan coba lagi.');
            await this.loadPhotos(this.currentPage);
        }
    }

    _showDeleteConfirm(card, filename) {
        const existing = card.querySelector('.gallery-delete-confirm');
        if (existing) return;

        const overlay = document.createElement('div');
        overlay.className = 'gallery-delete-confirm';

        const text = document.createElement('div');
        text.className = 'gallery-delete-text';
        text.textContent = 'Hapus foto ini?';

        const actions = document.createElement('div');
        actions.className = 'gallery-delete-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'gallery-delete-btn gallery-delete-cancel-btn';
        cancelBtn.textContent = 'Batal';
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
        });

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'gallery-delete-btn gallery-delete-confirm-btn';
        confirmBtn.textContent = 'Hapus';
        confirmBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            confirmBtn.disabled = true;
            confirmBtn.textContent = '...';
            await this._deletePhoto(filename);
        });

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        overlay.appendChild(text);
        overlay.appendChild(actions);
        card.appendChild(overlay);
    }

    async _deletePhoto(filename) {
        try {
            const formData = new URLSearchParams();
            formData.append('filename', filename);
            formData.append('csrf_token', this.csrfToken);

            const res = await fetch('api/delete-photo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            const data = await res.json();
            if (data.success) {
                await this.loadPhotos(this.currentPage);
            } else {
                alert(data.message || 'Gagal menghapus foto');
                await this.loadPhotos(this.currentPage);
            }
        } catch (e) {
            console.error('[Gallery] Delete error:', e);
            alert('Gagal menghapus foto. Silakan coba lagi.');
            await this.loadPhotos(this.currentPage);
        }
    }

    _selectPhoto(filename) {
        this.selectedFilename = filename;
        this._openPrintModal();
    }

    _openPrintModal() {
        if (!this.printModal || !this.selectedFilename) return;

        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) btnDownload.style.display = 'none';

        const btnHome = document.getElementById('btnHome');
        if (btnHome) btnHome.style.display = 'none';

        this.printModal.classList.add('on');
    }

    _bindModalEvents() {
        if (this.printModal) {
            this.printModal.addEventListener('click', (e) => {
                if (e.target === this.printModal) this._closePrintModal();
            });
        }

        document.getElementById('btnClosePrint')?.addEventListener('click', () => this._closePrintModal());

        document.getElementById('btnPrint')?.addEventListener('click', () => this._printPhoto());
        document.getElementById('btnEmailAction')?.addEventListener('click', () => this._openEmailModal());
        document.getElementById('btnQrAction')?.addEventListener('click', () => this._openQRModal());
        document.getElementById('btnCloseQr')?.addEventListener('click', () => this._closeQRModal());
        document.getElementById('btnCloseEmail')?.addEventListener('click', () => this._closeEmailModal());
        document.getElementById('btnSendEmail')?.addEventListener('click', () => this._sendEmail());
    }

    _closePrintModal() {
        this.printModal?.classList.remove('on');
        this.qrModal && (this.qrModal.style.display = 'none');
        this.emailModal && (this.emailModal.style.display = 'none');

        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) btnDownload.style.display = '';
        const btnHome = document.getElementById('btnHome');
        if (btnHome) btnHome.style.display = '';
    }

    _openEmailModal() {
        this.emailModal && (this.emailModal.style.display = 'flex');
    }

    _closeEmailModal() {
        this.emailModal && (this.emailModal.style.display = 'none');
    }

    async _sendEmail() {
        const emailInput = document.getElementById('emailInput');
        const emailError = document.getElementById('emailError');
        const btnSend = document.getElementById('btnSendEmail');
        const email = emailInput.value.trim();

        const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/i;
        if (!emailRegex.test(email)) {
            emailError.style.display = 'block';
            emailInput.style.borderColor = 'red';
            return;
        }

        emailError.style.display = 'none';
        emailInput.style.borderColor = '';

        if (!this.selectedFilename) return;

        const originalBtnText = btnSend.innerHTML;
        btnSend.disabled = true;
        btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const res = await fetch('api/send-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: this.selectedFilename,
                    email: email,
                    csrf_token: this.csrfToken
                })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const data = await res.json();

            if (data.success) {
                btnSend.innerHTML = '<i class="fas fa-check"></i> Sent!';
                btnSend.style.background = '#28a745';
                setTimeout(() => {
                    this._closeEmailModal();
                    btnSend.disabled = false;
                    btnSend.innerHTML = originalBtnText;
                    btnSend.style.background = '';
                    emailInput.value = '';
                }, 3000);
            } else {
                throw new Error(data.message || 'Failed to send email');
            }
        } catch (e) {
            console.error('[Gallery] Email error:', e);
            btnSend.disabled = false;
            btnSend.innerHTML = originalBtnText;
            alert('Gagal mengirim email. Silakan coba lagi.');
        }
    }

    _openQRModal() {
        if (!this.selectedFilename) return;

        this.qrModal.style.display = 'flex';
        const loading = document.getElementById('qrLoading');
        const image = document.getElementById('qrImage');
        if (loading) loading.style.display = 'block';
        if (image) image.style.display = 'none';

        const baseUrl = window.location.protocol + '//' + window.location.host;
        const viewUrl = `${baseUrl}/view-photo.php?file=${encodeURIComponent(this.selectedFilename)}`;

        ClientQR.generate(viewUrl, { size: 300, darkColor: '#000000', lightColor: '#ffffff' })
            .then(qrDataUrl => {
                const qrImage = document.getElementById('qrImage');
                qrImage.src = qrDataUrl;
                qrImage.onload = () => {
                    if (loading) loading.style.display = 'none';
                    if (image) image.style.display = 'block';
                };
            })
            .catch(e => {
                console.error('[Gallery] QR error:', e);
                this._closeQRModal();
            });
    }

    _closeQRModal() {
        this.qrModal && (this.qrModal.style.display = 'none');
    }

    async _printPhoto() {
        if (!this.selectedFilename) return;

        try {
            const photoUrl = 'uploads/photos/' + this.selectedFilename;
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = photoUrl;
            });

            const printCanvas = document.createElement('canvas');
            printCanvas.width = img.width;
            printCanvas.height = img.height;
            const ctx = printCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const blobUrl = printCanvas.toDataURL('image/png');
            const blob = await (await fetch(blobUrl)).blob();
            const objectUrl = URL.createObjectURL(blob);

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:100%;height:100%;';
            document.body.appendChild(iframe);

            let printFired = false;
            const doPrint = () => {
                if (printFired) return;
                printFired = true;
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) {
                    console.error('[Gallery] Print failed:', e);
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
    <img src="${objectUrl}" onload="setTimeout(() => window.parent.postMessage('print-ready', '*'), 200);">
</body>
</html>`);
            iframeDoc.close();

            window.addEventListener('message', function handler(e) {
                if (e.data === 'print-ready') {
                    window.removeEventListener('message', handler);
                    doPrint();
                }
            });

            setTimeout(doPrint, 800);
            setTimeout(() => {
                try {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(objectUrl);
                } catch (e) {}
            }, 15000);
        } catch (e) {
            console.error('[Gallery] Print error:', e);
            alert('Gagal menyiapkan foto untuk dicetak.');
        }
    }
}
